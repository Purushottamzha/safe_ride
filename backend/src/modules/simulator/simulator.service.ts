import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TrackingGateway } from '../tracking/tracking.gateway';
import { NotificationGateway } from '../notifications/notification.gateway';
import { NotificationRulesService } from '../notifications/notification-rules.service';
import { DriverSafetyService } from '../driver-safety/driver-safety.service';


interface SimulatedBus {
  tripId: string;
  busId: string;
  driverId: string;
  assignmentId: string;
  schoolId: string;
  routeStops: Array<{ stopId: string; name: string; lat: number; lng: number; sequence: number }>;
  currentStopIndex: number;
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  occupancy: number;
  capacity: number;
  status: string;
  type: string;
  direction: string;
  completedStops: number[];
  boardedStudents: Set<string>;
  totalStudents: number;
  /** progress between stops 0..1 */
  waypointProgress: number;
}

@Injectable()
export class SimulatorService {
  private readonly logger = new Logger(SimulatorService.name);
  private activeSims: Map<string, SimulatedBus> = new Map();
  private tickInterval: NodeJS.Timeout | null = null;
  private speedMultiplier = 1;
  private isRunning = false;
  private tickMs = 2000;

  constructor(
    private prisma: PrismaService,
    private trackingGateway: TrackingGateway,
    private notificationGateway: NotificationGateway,
    private notificationRules: NotificationRulesService,
    private driverSafety: DriverSafetyService,
  ) {}

  async start(speed = 1) {
    if (this.isRunning) return { message: 'Simulator already running' };
    this.speedMultiplier = Math.max(1, Math.min(30, speed));
    this.isRunning = true;

    await this.initializeTrips();
    await this.broadcastStatus();

    this.tickInterval = setInterval(() => this.tick(), this.tickMs);
    this.logger.log(`Simulator started at ${this.speedMultiplier}x speed`);
    return { message: `Simulator started at ${this.speedMultiplier}x`, buses: this.activeSims.size };
  }

  stop() {
    this.isRunning = false;
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
    this.activeSims.clear();
    this.logger.log('Simulator stopped');
    this.broadcastStatus();
    return { message: 'Simulator stopped' };
  }

  getStatus() {
    return {
      running: this.isRunning,
      speed: this.speedMultiplier,
      buses: Array.from(this.activeSims.values()).map(b => ({
        tripId: b.tripId, busId: b.busId, lat: b.lat, lng: b.lng,
        speed: b.speed, heading: b.heading, occupancy: b.occupancy,
        status: b.status, currentStopIndex: b.currentStopIndex,
        progress: b.waypointProgress,
      })),
    };
  }

  setSpeed(speed: number) {
    this.speedMultiplier = Math.max(1, Math.min(30, speed));
    return { speed: this.speedMultiplier };
  }

  private async initializeTrips() {
    const assignments = await this.prisma.assignment.findMany({
      where: { isActive: true },
      include: {
        route: { include: { routeStops: { orderBy: { sequence: 'asc' }, include: { stop: true } } } },
        busAssignments: { include: { bus: true } },
        driverAssignments: { include: { driver: { include: { user: true } } } },
        studentAssignments: { include: { student: true } },
      },
    });

    if (assignments.length === 0) {
      this.logger.warn('No active assignments found for simulation');
      return;
    }

    for (const assignment of assignments) {
      const busAssign = assignment.busAssignments[0];
      const driverAssign = assignment.driverAssignments[0];
      if (!busAssign || !driverAssign) continue;

      const routeStops = assignment.route?.routeStops || [];
      if (routeStops.length === 0) continue;

      const students = assignment.studentAssignments.map(sa => sa.student);
      const totalStudents = students.length;
      const capacity = busAssign.bus.capacity || 40;

      const morningTrip = await this.ensureTrip(assignment, busAssign.bus, driverAssign.driver.user, 'MORNING');
      if (!morningTrip) continue;

      const firstStop = routeStops[0];
      this.activeSims.set(morningTrip.id, {
        tripId: morningTrip.id,
        busId: busAssign.bus.id,
        driverId: driverAssign.driver.userId,
        assignmentId: assignment.id,
        schoolId: assignment.schoolId,
        routeStops: routeStops.map(rs => ({
          stopId: rs.stop.id, name: rs.stop.name,
          lat: rs.stop.latitude ?? 27.7 + Math.random() * 0.05,
          lng: rs.stop.longitude ?? 85.3 + Math.random() * 0.05,
          sequence: rs.sequence,
        })),
        currentStopIndex: 0,
        lat: firstStop.stop.latitude ?? 27.7,
        lng: firstStop.stop.longitude ?? 85.3,
        speed: 0,
        heading: 0,
        occupancy: 0,
        capacity,
        status: 'SCHEDULED',
        type: 'MORNING',
        direction: 'TO_SCHOOL',
        completedStops: [],
        boardedStudents: new Set(),
        totalStudents,
        waypointProgress: 0,
      });

      this.logger.log(`Simulated trip ${morningTrip.id}: ${busAssign.bus.busNumber} → ${students.length} students`);
    }

    await this.startAllTrips();
  }

  private async ensureTrip(assignment: any, bus: any, driver: any, type: string) {
    const existing = await (this.prisma as any).trip.findFirst({
      where: { assignmentId: assignment.id, type, status: { notIn: ['COMPLETED', 'CANCELLED'] } },
    });
    if (existing) return existing;

    const today = new Date();
    today.setHours(type === 'MORNING' ? 7 : 13, 0, 0, 0);

    return (this.prisma as any).trip.create({
      data: {
        type,
        status: 'SCHEDULED',
        scheduledAt: today,
        driverId: driver.id,
        busId: bus.id,
        routeId: assignment.routeId,
        assignmentId: assignment.id,
        schoolId: assignment.schoolId,
      },
    });
  }

  private async startAllTrips() {
    for (const [tripId, bus] of this.activeSims) {
      try {
        await (this.prisma as any).trip.update({
          where: { id: tripId },
          data: { status: 'ACTIVE', startedAt: new Date() },
        });
        bus.status = 'ACTIVE';

        const driver = await this.prisma.user.findUnique({ where: { id: bus.driverId } });
        const busObj = await this.prisma.bus.findUnique({ where: { id: bus.busId } });

        this.trackingGateway.server?.to(`school:${bus.schoolId}`).emit('trip:started', {
          tripId, busId: bus.busId, type: bus.type, startedAt: new Date(),
        });

        await this.notificationRules.handleTripStarted({
          tripId, tripType: bus.type, tripStatus: 'ACTIVE', schoolId: bus.schoolId,
          busNumber: busObj?.busNumber, driverName: driver ? `${driver.firstName} ${driver.lastName}` : undefined,
          direction: bus.direction,
        });

        bus.speed = 25 + Math.random() * 15;
      } catch (e) {
        this.logger.error(`Failed to start trip ${tripId}: ${e}`);
      }
    }
  }

  private async tick() {
    if (!this.isRunning) return;

    for (const [, bus] of this.activeSims) {
      await this.moveBus(bus);
    }
  }

  private async moveBus(bus: SimulatedBus) {
    const stops = bus.routeStops;
    if (bus.currentStopIndex >= stops.length - 1) {
      await this.completeTrip(bus);
      return;
    }

    const currentStop = stops[bus.currentStopIndex];
    const nextStop = stops[bus.currentStopIndex + 1];

    bus.waypointProgress += (0.03 * this.speedMultiplier);

    if (bus.waypointProgress >= 0.8 && !bus.completedStops.includes(bus.currentStopIndex)) {
      bus.completedStops.push(bus.currentStopIndex);
      bus.speed = 5 + Math.random() * 5;
    }

    if (bus.waypointProgress >= 1) {
      bus.waypointProgress = 0;
      bus.currentStopIndex++;
      bus.speed = 0;

      await this.simulateStopArrival(bus, nextStop);

      if (bus.currentStopIndex >= stops.length - 1) {
        await this.completeTrip(bus);
        return;
      }

      setTimeout(() => {
        bus.speed = 20 + Math.random() * 20;
        bus.heading = this.calculateHeading(
          stops[bus.currentStopIndex].lat, stops[bus.currentStopIndex].lng,
          stops[bus.currentStopIndex + 1]?.lat || stops[bus.currentStopIndex].lat,
          stops[bus.currentStopIndex + 1]?.lng || stops[bus.currentStopIndex].lng,
        );
      }, 3000 / this.speedMultiplier);
    }

    bus.lat = currentStop.lat + (nextStop.lat - currentStop.lat) * bus.waypointProgress;
    bus.lng = currentStop.lng + (nextStop.lng - currentStop.lng) * bus.waypointProgress;
    bus.heading = this.calculateHeading(currentStop.lat, currentStop.lng, nextStop.lat, nextStop.lng);

    const remainingDistance = this.calculateRemainingDistance(bus);
    const nextStopDistance = this.haversine(bus.lat, bus.lng, nextStop.lat, nextStop.lng);
    const etaMinutes = Math.round((remainingDistance / 1000) / Math.max(20, bus.speed) * 60);

    this.trackingGateway.server?.to(`school:${bus.schoolId}`).emit('bus:location', {
      busId: bus.busId, lat: bus.lat, lng: bus.lng, speed: bus.speed,
      heading: Math.round(bus.heading), tripId: bus.tripId,
      driverName: '', routeName: '',
      occupancy: bus.occupancy, capacity: bus.capacity,
      eta: `${etaMinutes} min`,
      nextStopName: nextStop.name,
      nextStopDistance: Math.round(nextStopDistance),
      remainingDistance: Math.round(remainingDistance),
      stopSequence: bus.currentStopIndex + 1,
      totalStops: bus.routeStops.length,
      completedStops: bus.completedStops.length,
      tripStatus: bus.status,
      lastUpdate: new Date().toISOString(),
    });

    this.prisma.tripWaypoint.create({
      data: { tripId: bus.tripId, latitude: bus.lat, longitude: bus.lng, speed: bus.speed, heading: Math.round(bus.heading), occupancy: bus.occupancy },
    }).catch(() => {});

    this.trackingGateway.server?.to(`driver:${bus.driverId}`).emit('trip:update', {
      tripId: bus.tripId, lat: bus.lat, lng: bus.lng, speed: bus.speed,
      heading: Math.round(bus.heading), nextStop: nextStop.name,
      nextStopDistance: Math.round(nextStopDistance),
    });
  }

  private async simulateStopArrival(bus: SimulatedBus, stop: typeof bus.routeStops[0]) {
    await this.prisma.trip.update({
      where: { id: bus.tripId },
      data: {
        currentStopId: stop.stopId,
        currentStopLat: stop.lat, currentStopLng: stop.lng,
        stopSequence: stop.sequence,
        completedStops: bus.completedStops.length,
        totalStops: bus.routeStops.length,
      },
    });

    this.trackingGateway.server?.to(`school:${bus.schoolId}`).emit('stop:reached', {
      tripId: bus.tripId, stopId: stop.stopId, stopName: stop.name,
      sequence: stop.sequence,
    });

    const studentsToBoard = Math.max(1, Math.floor(bus.totalStudents / (bus.routeStops.length - 1)));
    for (let i = 0; i < studentsToBoard && bus.occupancy < bus.capacity; i++) {
      bus.occupancy++;
    }

    if (bus.occupancy > 0) {
      const delay = 500 / this.speedMultiplier;
      const studentIds = Array.from({ length: Math.min(studentsToBoard, bus.totalStudents - bus.boardedStudents.size) }, (_, i) => `sim-${bus.tripId}-${i}`);
      for (const sid of studentIds) {
        if (bus.boardedStudents.has(sid)) continue;
        bus.boardedStudents.add(sid);
        await new Promise(r => setTimeout(r, delay));

        this.trackingGateway.server?.to(`school:${bus.schoolId}`).emit('attendance:update', {
          studentId: sid, studentName: `Student ${sid.slice(-3)}`,
          tripId: bus.tripId, scanType: 'BOARD_IN',
          timestamp: new Date().toISOString(),
        });
      }
    }

    bus.status = 'DRIVING_TO_SCHOOL';
    await this.prisma.trip.update({
      where: { id: bus.tripId },
      data: {
        status: 'DRIVING_TO_SCHOOL',
        boardCount: bus.occupancy,
        completedStops: bus.completedStops.length,
      },
    });
  }

  private async completeTrip(bus: SimulatedBus) {
    bus.speed = 0;

    await this.prisma.trip.update({
      where: { id: bus.tripId },
      data: { status: 'COMPLETED', completedAt: new Date(), dropCount: bus.occupancy },
    });

    this.trackingGateway.server?.to(`school:${bus.schoolId}`).emit('trip:completed', {
      tripId: bus.tripId, busId: bus.busId, completedAt: new Date(),
    });

    await this.notificationRules.handleTripCompleted({
      tripId: bus.tripId, tripType: bus.type, tripStatus: 'COMPLETED',
      schoolId: bus.schoolId, direction: bus.direction,
    });

    this.activeSims.delete(bus.tripId);
    this.logger.log(`Trip ${bus.tripId} completed`);

    if (this.activeSims.size === 0) {
      this.logger.log('All simulated trips completed');
      this.broadcastStatus();
    }
  }

  private broadcastStatus() {
    this.notificationGateway.sendToSchool('all', 'simulator:status', this.getStatus());
  }

  private calculateHeading(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const y = Math.sin(dLng) * Math.cos((lat2 * Math.PI) / 180);
    const x = Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
      Math.sin((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.cos(dLng);
    return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
  }

  private calculateRemainingDistance(bus: SimulatedBus): number {
    let total = 0;
    for (let i = bus.currentStopIndex; i < bus.routeStops.length - 1; i++) {
      const from = bus.routeStops[i];
      const to = bus.routeStops[i + 1];
      total += this.haversine(from.lat, from.lng, to.lat, to.lng);
    }
    total *= (1 - bus.waypointProgress);
    return total;
  }

  private haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
}
