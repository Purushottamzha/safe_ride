import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { NotificationGateway } from '../notifications/notification.gateway';
import { NotificationRulesService } from '../notifications/notification-rules.service';
import { Prisma, TripType, TripStatus } from '@prisma/client';
import { IncidentsService } from '../incidents/incidents.service';

const VALID_TRANSITIONS: Record<TripStatus, TripStatus[]> = {
  SCHEDULED: ['DRIVER_ASSIGNED', 'CANCELLED'],
  DRIVER_ASSIGNED: ['BUS_ASSIGNED', 'SCHEDULED', 'CANCELLED'],
  BUS_ASSIGNED: ['READY', 'DRIVER_ASSIGNED', 'CANCELLED'],
  READY: ['ACTIVE', 'BUS_ASSIGNED', 'CANCELLED'],
  ACTIVE: ['DRIVING_TO_PICKUP', 'CANCELLED'],
  DRIVING_TO_PICKUP: ['AT_STOP', 'CANCELLED'],
  AT_STOP: ['BOARDING', 'DRIVING_TO_PICKUP', 'CANCELLED'],
  BOARDING: ['DRIVING_TO_SCHOOL', 'AT_STOP', 'CANCELLED'],
  DRIVING_TO_SCHOOL: ['SCHOOL_ARRIVED', 'CANCELLED'],
  SCHOOL_ARRIVED: ['DRIVING_TO_DROP', 'CANCELLED'],
  DRIVING_TO_DROP: ['AT_STOP', 'CANCELLED'],
  DROPPING: ['DRIVING_TO_DROP', 'COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

@Injectable()
export class TripsService {
  constructor(
    private prisma: PrismaService,
    private notificationGateway: NotificationGateway,
    private notificationRules: NotificationRulesService,
    private incidentsService: IncidentsService,
  ) {}

  private assertValidTransition(current: TripStatus, next: TripStatus): void {
    const allowed = VALID_TRANSITIONS[current];
    if (!allowed || !allowed.includes(next)) {
      throw new BadRequestException(
        `Cannot transition trip from ${current} to ${next}. Valid transitions: ${allowed?.join(', ') || 'none'}`,
      );
    }
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    schoolId?: string;
    status?: TripStatus;
    type?: TripType;
    driverId?: string;
    busId?: string;
    routeId?: string;
    fromDate?: string;
    toDate?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;
    const where: Prisma.TripWhereInput = { deletedAt: null };
    if (params.schoolId) where.schoolId = params.schoolId;
    if (params.status) where.status = params.status;
    if (params.type) where.type = params.type;
    if (params.driverId) where.driverId = params.driverId;
    if (params.busId) where.busId = params.busId;
    if (params.routeId) where.routeId = params.routeId;

    const fromDate = params.fromDate || params.startDate;
    const toDate = params.toDate || params.endDate;
    if (fromDate || toDate) {
      where.scheduledAt = {};
      if (fromDate) where.scheduledAt.gte = new Date(fromDate);
      if (toDate) where.scheduledAt.lte = new Date(toDate);
    }

    const [data, total] = await Promise.all([
      this.prisma.trip.findMany({
        where, skip, take: limit,
        orderBy: { scheduledAt: 'desc' },
        include: {
          driver: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
          bus: { select: { id: true, plateNumber: true, busNumber: true, capacity: true } },
          route: { select: { id: true, name: true, code: true } },
          school: { select: { id: true, name: true } },
          _count: { select: { tripEvents: true, attendance: true } },
        },
      }),
      this.prisma.trip.count({ where }),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit), hasNextPage: page * limit < total, hasPreviousPage: page > 1 },
    };
  }

  async findById(id: string) {
    const trip = await this.prisma.trip.findFirst({
      where: { id, deletedAt: null },
      include: {
        driver: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        bus: { select: { id: true, plateNumber: true, busNumber: true, capacity: true, model: true } },
        route: {
          select: { id: true, name: true, code: true, direction: true, routeStops: { include: { stop: true }, orderBy: { sequence: 'asc' } } },
        },
        school: { select: { id: true, name: true } },
        assignment: { select: { id: true, name: true,
          driverAssignments: { include: { driver: { include: { user: { select: { firstName: true, lastName: true } } } } } },
          busAssignments: { include: { bus: { select: { id: true, plateNumber: true, busNumber: true } } } },
          studentAssignments: { include: { student: { select: { id: true, firstName: true, lastName: true, studentId: true, grade: true, section: true, profilePicture: true } }, stop: true } },
        }},
        tripEvents: { orderBy: { createdAt: 'desc' }, take: 100, include: { student: { select: { id: true, firstName: true, lastName: true, studentId: true, grade: true, section: true } } } },
        attendance: { include: { student: { select: { id: true, firstName: true, lastName: true, studentId: true, grade: true, section: true, profilePicture: true } } } },
      },
    });
    if (!trip) throw new NotFoundException('Trip not found');
    return trip;
  }

  async create(data: {
    type: TripType;
    scheduledAt: string;
    driverId?: string;
    busId?: string;
    routeId?: string;
    assignmentId?: string;
    schoolId: string;
    notes?: string;
  }) {
    const scheduledAt = new Date(data.scheduledAt);

    let totalStops = 0;
    if (data.routeId) {
      totalStops = await this.prisma.routeStop.count({ where: { routeId: data.routeId } });
    }

    const status = data.driverId && data.busId ? TripStatus.READY
      : data.driverId ? TripStatus.DRIVER_ASSIGNED
      : data.busId ? TripStatus.BUS_ASSIGNED
      : TripStatus.SCHEDULED;

    const trip = await this.prisma.trip.create({
      data: {
        type: data.type, scheduledAt,
        driverId: data.driverId, busId: data.busId, routeId: data.routeId,
        assignmentId: data.assignmentId, schoolId: data.schoolId,
        notes: data.notes, status, totalStops,
      },
      include: {
        driver: { select: { id: true, firstName: true, lastName: true } },
        bus: { select: { id: true, plateNumber: true, busNumber: true } },
        route: { select: { id: true, name: true, code: true } },
        school: { select: { id: true, name: true } },
      },
    });

    if (data.driverId) {
      this.notificationGateway.sendToUser(data.driverId, 'trip:created', { tripId: trip.id, type: trip.type, scheduledAt: trip.scheduledAt });
      await this.prisma.notification.create({
        data: {
          type: 'TRIP_UPDATE', channel: 'WEBSOCKET',
          title: 'New Trip Scheduled',
          body: `A ${trip.type === 'MORNING' ? 'morning' : 'afternoon'} trip has been scheduled.`,
          userId: data.driverId, schoolId: data.schoolId,
          data: { tripId: trip.id, type: trip.type, scheduledAt: trip.scheduledAt } as any,
          sentAt: new Date(),
        },
      });
    }

    return trip;
  }

  async updateTripStatus(id: string, newStatus: TripStatus, extra?: Record<string, any>) {
    const trip = await this.prisma.trip.findFirst({ where: { id, deletedAt: null } });
    if (!trip) throw new NotFoundException('Trip not found');

    this.assertValidTransition(trip.status, newStatus);

    const updateData: Record<string, any> = { status: newStatus, ...extra };

    if (newStatus === 'ACTIVE' || newStatus === 'DRIVING_TO_PICKUP') {
      if (!updateData.startedAt) updateData.startedAt = new Date();
    }
    if (newStatus === 'COMPLETED') {
      if (!updateData.completedAt) updateData.completedAt = new Date();
    }
    if (newStatus === 'CANCELLED') {
      if (!updateData.cancelledAt) updateData.cancelledAt = new Date();
    }

    const updatedTrip = await this.prisma.trip.update({
      where: { id }, data: updateData,
      include: {
        driver: { select: { id: true, firstName: true, lastName: true } },
        bus: { select: { id: true, plateNumber: true, busNumber: true } },
        route: { select: { id: true, name: true, code: true } },
        school: { select: { id: true, name: true } },
      },
    });

    this.notificationGateway.sendToSchool(trip.schoolId, 'trip:status', {
      tripId: id, status: newStatus, timestamp: new Date().toISOString(),
    });

    if (trip.driverId) {
      this.notificationGateway.sendToUser(trip.driverId, 'trip:status', {
        tripId: id, status: newStatus, timestamp: new Date().toISOString(),
      });
    }

    return updatedTrip;
  }

  async assignDriver(id: string, driverId: string) {
    const trip = await this.prisma.trip.findFirst({ where: { id, deletedAt: null } });
    if (!trip) throw new NotFoundException('Trip not found');
    this.assertValidTransition(trip.status, 'DRIVER_ASSIGNED');

    const hasActiveTrips = await this.prisma.trip.findFirst({
      where: { driverId, status: { in: ['ACTIVE', 'DRIVING_TO_PICKUP', 'AT_STOP', 'BOARDING', 'DRIVING_TO_SCHOOL', 'DRIVING_TO_DROP', 'DROPPING'] }, deletedAt: null, id: { not: id } },
    });
    if (hasActiveTrips) {
      throw new BadRequestException('Driver already has an active trip');
    }

    const nextStatus = trip.busId ? TripStatus.READY : TripStatus.DRIVER_ASSIGNED;
    return this.updateTripStatus(id, nextStatus, { driverId });
  }

  async assignBus(id: string, busId: string) {
    const trip = await this.prisma.trip.findFirst({ where: { id, deletedAt: null } });
    if (!trip) throw new NotFoundException('Trip not found');
    this.assertValidTransition(trip.status, 'BUS_ASSIGNED');

    const hasActiveTrips = await this.prisma.trip.findFirst({
      where: { busId, status: { in: ['ACTIVE', 'DRIVING_TO_PICKUP', 'AT_STOP', 'BOARDING', 'DRIVING_TO_SCHOOL', 'DRIVING_TO_DROP', 'DROPPING'] }, deletedAt: null, id: { not: id } },
    });
    if (hasActiveTrips) {
      throw new BadRequestException('Bus already on an active trip');
    }

    const nextStatus = trip.driverId ? TripStatus.READY : TripStatus.BUS_ASSIGNED;
    return this.updateTripStatus(id, nextStatus, { busId });
  }

  async startTrip(id: string) {
    const trip = await this.prisma.trip.findFirst({ where: { id, deletedAt: null } });
    if (!trip) throw new NotFoundException('Trip not found');
    this.assertValidTransition(trip.status, 'ACTIVE');
    if (!trip.driverId) throw new BadRequestException('Trip must have a driver assigned');
    if (!trip.busId) throw new BadRequestException('Trip must have a bus assigned');

    const result = await this.updateTripStatus(id, TripStatus.ACTIVE, { startedAt: new Date() });

    const bus = trip.busId ? await this.prisma.bus.findUnique({ where: { id: trip.busId } }) : null;
    const driver = trip.driverId ? await this.prisma.user.findUnique({ where: { id: trip.driverId } }) : null;

    this.notificationGateway.sendToSchool(trip.schoolId, 'trip:started', {
      tripId: id, busId: trip.busId, type: trip.type, startedAt: new Date(),
    });

    this.notificationRules.handleTripStarted({
      tripId: id, tripType: trip.type, tripStatus: TripStatus.ACTIVE, schoolId: trip.schoolId,
      busNumber: bus?.busNumber, driverName: driver ? `${driver.firstName} ${driver.lastName}` : undefined,
      direction: trip.type === 'MORNING' ? 'TO_SCHOOL' : 'FROM_SCHOOL',
    });

    return result;
  }

  async reachStop(id: string, stopId: string, stopLat: number, stopLng: number) {
    const trip = await this.prisma.trip.findFirst({
      where: { id, deletedAt: null },
      include: { route: { include: { routeStops: { orderBy: { sequence: 'asc' }, include: { stop: true } } } } },
    });
    if (!trip) throw new NotFoundException('Trip not found');
    this.assertValidTransition(trip.status, 'AT_STOP');

    const stopIndex = trip.route?.routeStops.findIndex(rs => rs.stop.id === stopId) ?? -1;
    if (stopIndex < 0) throw new BadRequestException('Stop not found on this route');

    const completedStops = stopIndex;
    const stopSequence = stopIndex + 1;

    const result = await this.updateTripStatus(id, TripStatus.AT_STOP, {
      currentStopId: stopId, currentStopLat: stopLat, currentStopLng: stopLng,
      stopSequence, completedStops, totalStops: trip.route?.routeStops.length || 0,
    });

    this.notificationGateway.sendToSchool(trip.schoolId, 'stop:reached', {
      tripId: id, stopId, stopName: trip.route?.routeStops[stopIndex]?.stop.name,
      sequence: stopSequence, totalStops: trip.route?.routeStops.length,
    });

    return result;
  }

  async completeBoarding(id: string) {
    const trip = await this.prisma.trip.findFirst({ where: { id, deletedAt: null } });
    if (!trip) throw new NotFoundException('Trip not found');
    this.assertValidTransition(trip.status, 'DRIVING_TO_SCHOOL');

    const boardCount = await this.prisma.attendance.count({
      where: { tripId: id, boardTime: { not: null } },
    });

    const nextStatus = trip.type === 'MORNING' ? TripStatus.DRIVING_TO_SCHOOL : TripStatus.DRIVING_TO_DROP;
    return this.updateTripStatus(id, nextStatus, { boardCount });
  }

  async arriveAtSchool(id: string) {
    const trip = await this.prisma.trip.findFirst({ where: { id, deletedAt: null } });
    if (!trip) throw new NotFoundException('Trip not found');
    this.assertValidTransition(trip.status, 'SCHOOL_ARRIVED');
    return this.updateTripStatus(id, TripStatus.SCHOOL_ARRIVED);
  }

  async startDrop(id: string) {
    const trip = await this.prisma.trip.findFirst({ where: { id, deletedAt: null } });
    if (!trip) throw new NotFoundException('Trip not found');
    this.assertValidTransition(trip.status, 'DRIVING_TO_DROP');
    return this.updateTripStatus(id, TripStatus.DRIVING_TO_DROP);
  }

  async completeTrip(id: string, dto?: { notes?: string; force?: boolean; unresolvedReason?: string; userId?: string }) {
    const trip = await this.prisma.trip.findFirst({ where: { id, deletedAt: null } });
    if (!trip) throw new NotFoundException('Trip not found');
    this.assertValidTransition(trip.status, 'COMPLETED');

    const unaccounted = await this.prisma.attendance.findMany({
      where: {
        tripId: id,
        boardTime: { not: null },
        exitTime: null,
      },
      include: {
        student: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (unaccounted.length > 0) {
      const studentNames = unaccounted.map(a => `${a.student.firstName} ${a.student.lastName}`).join(', ');

      if (!dto?.force) {
        throw new BadRequestException(
          `Cannot complete trip: ${unaccounted.length} student(s) still unaccounted for: ${studentNames}. Use force=true to override.`,
        );
      }

      await this.incidentsService.create({
        title: 'Students not confirmed exited',
        description: dto.unresolvedReason || `Trip completed with ${unaccounted.length} student(s) not confirmed as exited: ${studentNames}`,
        severity: 'MEDIUM',
        reportedById: dto.userId || 'system',
        tripId: id,
      });
    }

    const dropCount = await this.prisma.attendance.count({
      where: { tripId: id, exitTime: { not: null } },
    });

    const result = await this.updateTripStatus(id, TripStatus.COMPLETED, {
      completedAt: new Date(), notes: dto?.notes || trip.notes, dropCount,
    });

    this.notificationGateway.sendToSchool(trip.schoolId, 'trip:completed', {
      tripId: id, busId: trip.busId, completedAt: new Date(),
    });

    this.notificationRules.handleTripCompleted({
      tripId: id, tripType: trip.type, tripStatus: TripStatus.COMPLETED, schoolId: trip.schoolId,
      direction: trip.type === 'MORNING' ? 'TO_SCHOOL' : 'FROM_SCHOOL',
    });

    return result;
  }

  async cancelTrip(id: string, reason?: string) {
    const trip = await this.prisma.trip.findFirst({ where: { id, deletedAt: null } });
    if (!trip) throw new NotFoundException('Trip not found');
    this.assertValidTransition(trip.status, 'CANCELLED');

    const result = await this.updateTripStatus(id, TripStatus.CANCELLED, {
      cancelledAt: new Date(), cancelReason: reason || null,
    });

    this.notificationGateway.sendToSchool(trip.schoolId, 'trip:cancelled', {
      tripId: id, reason: reason || null, cancelledAt: new Date(),
    });

    return result;
  }

  async update(id: string, data: Partial<{ type: TripType; status: TripStatus; scheduledAt: string; notes: string; driverId: string; busId: string; routeId: string; assignmentId: string }>) {
    const trip = await this.prisma.trip.findFirst({ where: { id, deletedAt: null } });
    if (!trip) throw new NotFoundException('Trip not found');

    const updateData: Record<string, unknown> = { ...data };
    if (data.scheduledAt) updateData.scheduledAt = new Date(data.scheduledAt);
    delete updateData.status;
    if (data.status && data.status !== trip.status) {
      throw new BadRequestException('Use specific service methods to change trip status');
    }

    return this.prisma.trip.update({ where: { id }, data: updateData, include: { driver: { select: { id: true, firstName: true, lastName: true } }, bus: { select: { id: true, plateNumber: true, busNumber: true } }, route: { select: { id: true, name: true, code: true } } } });
  }

  async getCalendar(params: { startDate: string; endDate: string; schoolId?: string; type?: TripType }) {
    const where: Prisma.TripWhereInput = {
      deletedAt: null,
      scheduledAt: { gte: new Date(params.startDate), lte: new Date(params.endDate) },
    };
    if (params.schoolId) where.schoolId = params.schoolId;
    if (params.type) where.type = params.type;

    const trips = await this.prisma.trip.findMany({
      where,
      orderBy: { scheduledAt: 'asc' },
      include: {
        driver: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        bus: { select: { id: true, plateNumber: true, busNumber: true, capacity: true } },
        route: { select: { id: true, name: true, code: true, direction: true } },
        school: { select: { id: true, name: true } },
        assignment: { select: { id: true, name: true } },
        _count: { select: { attendance: true } },
      },
    });

    const grouped: Record<string, typeof trips> = {};
    for (const trip of trips) {
      const key = trip.scheduledAt.toISOString().split('T')[0];
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(trip);
    }

    return { trips, grouped, total: trips.length };
  }

  async checkConflicts(params: { scheduledAt: string; type: TripType; driverId?: string; busId?: string; excludeTripId?: string }) {
    const scheduledAt = new Date(params.scheduledAt);
    const dayStart = new Date(scheduledAt.getFullYear(), scheduledAt.getMonth(), scheduledAt.getDate());
    const dayEnd = new Date(dayStart.getTime() + 86400000);

    const conflicts: { type: 'driver' | 'bus'; id: string; name: string; tripId: string; tripTime: string }[] = [];

    if (params.driverId) {
      const driverTrips = await this.prisma.trip.findMany({
        where: {
          driverId: params.driverId,
          scheduledAt: { gte: dayStart, lt: dayEnd },
          status: { notIn: ['COMPLETED', 'CANCELLED'] },
          id: params.excludeTripId ? { not: params.excludeTripId } : undefined,
          deletedAt: null,
        },
        include: { driver: { select: { firstName: true, lastName: true } } },
      });

      for (const t of driverTrips) {
        conflicts.push({
          type: 'driver', id: params.driverId,
          name: `${t.driver?.firstName} ${t.driver?.lastName}`,
          tripId: t.id, tripTime: t.scheduledAt.toISOString(),
        });
      }
    }

    if (params.busId) {
      const busTrips = await this.prisma.trip.findMany({
        where: {
          busId: params.busId,
          scheduledAt: { gte: dayStart, lt: dayEnd },
          status: { notIn: ['COMPLETED', 'CANCELLED'] },
          id: params.excludeTripId ? { not: params.excludeTripId } : undefined,
          deletedAt: null,
        },
        include: { bus: { select: { plateNumber: true, busNumber: true } } },
      });

      for (const t of busTrips) {
        conflicts.push({
          type: 'bus', id: params.busId,
          name: `${t.bus?.busNumber || t.bus?.plateNumber}`,
          tripId: t.id, tripTime: t.scheduledAt.toISOString(),
        });
      }
    }

    return { hasConflicts: conflicts.length > 0, conflicts };
  }

  async softDelete(id: string): Promise<void> {
    const trip = await this.prisma.trip.findFirst({ where: { id, deletedAt: null } });
    if (!trip) throw new NotFoundException('Trip not found');
    await this.prisma.trip.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async getReplay(id: string) {
    const trip = await this.prisma.trip.findFirst({
      where: { id, deletedAt: null },
      include: {
        driver: { select: { id: true, firstName: true, lastName: true, phone: true } },
        bus: { select: { id: true, plateNumber: true, busNumber: true, capacity: true, model: true, color: true } },
        route: {
          select: { id: true, name: true, code: true, direction: true, routeStops: { include: { stop: true }, orderBy: { sequence: 'asc' } } },
        },
        school: { select: { id: true, name: true } },
      },
    });
    if (!trip) throw new NotFoundException('Trip not found');

    const [waypoints, tripEvents] = await Promise.all([
      this.prisma.tripWaypoint.findMany({
        where: { tripId: id },
        orderBy: { timestamp: 'asc' },
      }),
      this.prisma.tripEvent.findMany({
        where: { tripId: id },
        orderBy: { createdAt: 'asc' },
        include: { student: { select: { id: true, firstName: true, lastName: true, studentId: true, grade: true, section: true, profilePicture: true } } },
      }),
    ]);

    return { trip, waypoints, tripEvents };
  }
}
