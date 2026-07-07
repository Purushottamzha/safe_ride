import {
  WebSocketGateway, WebSocketServer, SubscribeMessage,
  OnGatewayConnection, OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger, Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';

const GEOFENCE_RADIUS_M = 100;
const STOP_DWELL_TIME_MS = 30000;

interface BusLocation {
  busId: string; lat: number; lng: number; speed: number; heading: number;
  tripId: string; driverName: string; routeName: string;
  occupancy: number; capacity: number; eta: string;
  nextStopName: string; nextStopDistance: number;
  remainingDistance: number; stopSequence: number; totalStops: number; completedStops: number;
  tripStatus: string; lastUpdate: string;
}

@Injectable()
@WebSocketGateway({ namespace: '/tracking', cors: { origin: '*', credentials: true } })
export class TrackingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(TrackingGateway.name);
  private stopDwellTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(private jwtService: JwtService, private prisma: PrismaService) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token = client.handshake.auth?.token || (client.handshake.query?.token as string);
      if (!token) { client.disconnect(); return; }
      const payload = this.jwtService.verify(token);
      client.data.userId = payload.sub || payload.id;
      client.data.role = payload.role;
      client.data.schoolId = payload.schoolId;
      if (payload.role === 'DRIVER') client.join(`driver:${client.data.userId}`);
      if (payload.schoolId) client.join(`school:${payload.schoolId}`);
    } catch { client.disconnect(); }
  }

  handleDisconnect(client: Socket): void {
    const driverId = client.data?.userId;
    if (driverId) {
      const timer = this.stopDwellTimers.get(driverId);
      if (timer) { clearTimeout(timer); this.stopDwellTimers.delete(driverId); }
    }
  }

  @SubscribeMessage('driver:location')
  async handleDriverLocation(client: Socket, payload: { tripId: string; lat: number; lng: number; speed: number; heading: number }): Promise<void> {
    const userId = client.data.userId;
    const schoolId = client.data.schoolId;
    if (!userId || !schoolId) return;

    const trip = await this.prisma.trip.findFirst({
      where: { id: payload.tripId, driverId: userId, status: { notIn: ['COMPLETED', 'CANCELLED'] } },
      include: {
        bus: { select: { id: true, capacity: true, lastGpsLat: true, lastGpsLng: true, lastGpsUpdate: true } },
        driver: { select: { firstName: true, lastName: true } },
        route: { select: { id: true, name: true, routeStops: { include: { stop: true }, orderBy: { sequence: 'asc' } } } },
      },
    });

    if (!trip?.bus || !trip.driver || !trip.route) return;

    await this.prisma.bus.update({
      where: { id: trip.bus.id },
      data: { lastGpsLat: payload.lat, lastGpsLng: payload.lng, lastGpsUpdate: new Date() },
    });

    const occupancy = await this.prisma.attendance.count({
      where: { tripId: payload.tripId, status: { in: ['BOARDED', 'PRESENT'] } },
    });

    const routeStops = trip.route.routeStops || [];
    const { nextStop, distanceToNext, remainingDist, stopIdx } = this.findNearestStop(
      payload.lat, payload.lng, routeStops,
    );

    const totalStops = routeStops.length;

    // Auto-detect geofence entry
    if (nextStop && distanceToNext <= GEOFENCE_RADIUS_M && !this.stopDwellTimers.has(userId)) {
      if (trip.status !== 'AT_STOP' && trip.status !== 'BOARDING') {
        const timer = setTimeout(async () => {
          if (distanceToNext <= GEOFENCE_RADIUS_M) {
            try {
              await this.prisma.trip.update({
                where: { id: payload.tripId },
                data: { status: 'AT_STOP', currentStopId: nextStop.stop.id, currentStopLat: nextStop.stop.latitude, currentStopLng: nextStop.stop.longitude, stopSequence: nextStop.sequence, completedStops: stopIdx, totalStops },
              });
              this.server.to(`school:${schoolId}`).emit('stop:reached', {
                tripId: payload.tripId, stopId: nextStop.stop.id, stopName: nextStop.stop.name,
                sequence: nextStop.sequence, totalStops,
                timestamp: new Date().toISOString(),
              });
            } catch (e) { /* status may have changed */ }
          }
          this.stopDwellTimers.delete(userId);
        }, STOP_DWELL_TIME_MS);
        this.stopDwellTimers.set(userId, timer);
      }
    } else if (nextStop && distanceToNext > GEOFENCE_RADIUS_M + 50) {
      const timer = this.stopDwellTimers.get(userId);
      if (timer) { clearTimeout(timer); this.stopDwellTimers.delete(userId); }
    }

    const busLoc: BusLocation = {
      busId: trip.bus.id, lat: payload.lat, lng: payload.lng,
      speed: payload.speed, heading: payload.heading,
      tripId: payload.tripId,
      driverName: `${trip.driver.firstName} ${trip.driver.lastName}`,
      routeName: trip.route.name,
      occupancy, capacity: trip.bus.capacity,
      eta: this.calculateEta(distanceToNext, payload.speed),
      nextStopName: nextStop?.stop.name || 'Final destination',
      nextStopDistance: Math.round(distanceToNext),
      remainingDistance: Math.round(remainingDist),
      stopSequence: nextStop?.sequence || totalStops,
      totalStops,
      completedStops: stopIdx,
      tripStatus: trip.status,
      lastUpdate: new Date().toISOString(),
    };

    this.server.to(`school:${schoolId}`).emit('bus:location', busLoc);

    const parentIds = await this.getParentIdsForTrip(payload.tripId, schoolId);
    for (const pid of parentIds) this.server.to(`user:${pid}`).emit('bus:location', busLoc);

    await this.prisma.tripWaypoint.create({
      data: { tripId: payload.tripId, latitude: payload.lat, longitude: payload.lng, speed: payload.speed, heading: payload.heading, occupancy },
    });
  }

  private findNearestStop(lat: number, lng: number, routeStops: any[]) {
    let nearestStop: any = null;
    let minDist = Infinity;
    let stopIdx = 0;
    let remainingDist = 0;
    let passedPrev = false;

    for (let i = 0; i < routeStops.length; i++) {
      const rs = routeStops[i];
      if (!rs.stop.latitude || !rs.stop.longitude) continue;
      const d = this.haversine(lat, lng, rs.stop.latitude, rs.stop.longitude);
      if (d < minDist) {
        minDist = d;
        nearestStop = rs;
        stopIdx = i;
      }
      if (d < 200) passedPrev = true;
      if (passedPrev && i > stopIdx) {
        remainingDist += this.haversine(lat, lng, rs.stop.latitude, rs.stop.longitude);
      }
    }

    const distanceToNext = minDist * 1000;

    return { nextStop: nearestStop, distanceToNext, remainingDist, stopIdx };
  }

  private haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  @SubscribeMessage('driver:trip:status')
  async handleTripStatus(client: Socket, payload: { tripId: string; status: string; notes?: string }): Promise<void> {
    const schoolId = client.data.schoolId;
    if (!schoolId) return;
    this.server.to(`school:${schoolId}`).emit('trip:status', {
      tripId: payload.tripId, status: payload.status, notes: payload.notes,
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('driver:emergency')
  async handleEmergency(client: Socket, payload: { tripId: string; type: string; lat?: number; lng?: number; message?: string }): Promise<void> {
    const schoolId = client.data.schoolId;
    if (!schoolId) return;
    await this.prisma.incident.create({
      data: {
        title: `${payload.type} Emergency`,
        description: payload.message || `${payload.type} reported during trip ${payload.tripId}`,
        severity: payload.type === 'SOS' ? 'CRITICAL' : payload.type === 'MEDICAL' ? 'HIGH' : 'MEDIUM',
        status: 'REPORTED', latitude: payload.lat, longitude: payload.lng,
        reportedById: client.data.userId, tripId: payload.tripId,
      },
    });
    this.server.to(`school:${schoolId}`).emit('emergency:alert', {
      type: payload.type, tripId: payload.tripId, lat: payload.lat, lng: payload.lng,
      message: payload.message, timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('admin:request-buses')
  async handleRequestBuses(client: Socket): Promise<void> {
    const schoolId = client.data.schoolId;
    if (!schoolId) return;
    const activeTrips = await this.prisma.trip.findMany({
      where: { schoolId, status: { notIn: ['COMPLETED', 'CANCELLED'] } },
      include: {
        bus: { select: { id: true, capacity: true, lastGpsLat: true, lastGpsLng: true, lastGpsUpdate: true } },
        driver: { select: { firstName: true, lastName: true } },
        route: { select: { name: true } },
      },
    });
    const buses: BusLocation[] = [];
    for (const t of activeTrips) {
      if (!t.bus || !t.driver) continue;
      const occupancy = await this.prisma.attendance.count({ where: { tripId: t.id, status: { in: ['BOARDED', 'PRESENT'] } } });
      buses.push({
        busId: t.bus.id, lat: t.bus.lastGpsLat || 27.68, lng: t.bus.lastGpsLng || 85.32,
        speed: 0, heading: 0, tripId: t.id,
        driverName: `${t.driver.firstName} ${t.driver.lastName}`,
        routeName: t.route?.name || 'Unknown',
        occupancy, capacity: t.bus.capacity, eta: '--:--',
        nextStopName: '', nextStopDistance: 0, remainingDistance: 0,
        stopSequence: 0, totalStops: 0, completedStops: 0,
        tripStatus: t.status, lastUpdate: t.bus.lastGpsUpdate?.toISOString() || new Date().toISOString(),
      });
    }
    client.emit('buses:all', buses);
  }

  private calculateEta(distanceM: number, speed: number): string {
    if (speed <= 0 || distanceM <= 0) return '--:--';
    const minutes = Math.round(distanceM / 1000 / Math.max(speed, 1) * 60);
    const now = new Date();
    now.setMinutes(now.getMinutes() + Math.max(1, minutes));
    return now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  private async getParentIdsForTrip(tripId: string, schoolId: string): Promise<string[]> {
    const attendance = await this.prisma.attendance.findMany({
      where: { tripId, schoolId },
      select: { student: { select: { parentStudents: { select: { parent: { select: { userId: true } } } } } } },
    });
    const parentIds = new Set<string>();
    for (const a of attendance) for (const sp of a.student.parentStudents) parentIds.add(sp.parent.userId);
    return Array.from(parentIds);
  }
}
