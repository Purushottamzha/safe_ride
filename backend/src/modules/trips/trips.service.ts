import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { NotificationGateway } from '../notifications/notification.gateway';
import { Prisma, TripType, TripStatus } from '@prisma/client';

@Injectable()
export class TripsService {
  constructor(
    private prisma: PrismaService,
    private notificationGateway: NotificationGateway,
  ) {}

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
        where,
        skip,
        take: limit,
        orderBy: { scheduledAt: 'desc' },
        include: {
          driver: {
            select: { id: true, firstName: true, lastName: true, email: true, phone: true },
          },
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
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findById(id: string) {
    const trip = await this.prisma.trip.findFirst({
      where: { id, deletedAt: null },
      include: {
        driver: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        bus: {
          select: { id: true, plateNumber: true, busNumber: true, capacity: true, model: true },
        },
        route: { select: { id: true, name: true, code: true, direction: true } },
        school: { select: { id: true, name: true } },
        assignment: {
          select: {
            id: true,
            name: true,
            driverAssignments: {
              include: {
                driver: { include: { user: { select: { firstName: true, lastName: true } } } },
              },
            },
            busAssignments: {
              include: { bus: { select: { id: true, plateNumber: true, busNumber: true } } },
            },
          },
        },
        tripEvents: {
          orderBy: { createdAt: 'desc' },
          take: 100,
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                studentId: true,
                grade: true,
                section: true,
              },
            },
          },
        },
        attendance: {
          include: {
            student: { select: { id: true, firstName: true, lastName: true, studentId: true } },
          },
        },
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

    const trip = await this.prisma.trip.create({
      data: {
        type: data.type,
        scheduledAt,
        driverId: data.driverId,
        busId: data.busId,
        routeId: data.routeId,
        assignmentId: data.assignmentId,
        schoolId: data.schoolId,
        notes: data.notes,
        status: 'SCHEDULED',
      },
      include: {
        driver: { select: { id: true, firstName: true, lastName: true } },
        bus: { select: { id: true, plateNumber: true, busNumber: true } },
        route: { select: { id: true, name: true, code: true } },
        school: { select: { id: true, name: true } },
      },
    });

    if (data.driverId) {
      const driverUser = await this.prisma.user.findFirst({
        where: { id: data.driverId, deletedAt: null },
      });
      if (driverUser) {
        this.notificationGateway.sendToUser(data.driverId, 'trip:created', {
          tripId: trip.id,
          type: trip.type,
          scheduledAt: trip.scheduledAt,
        });
        await this.prisma.notification.create({
          data: {
            type: 'TRIP_UPDATE',
            channel: 'WEBSOCKET',
            title: 'New Trip Scheduled',
            body: `A ${trip.type === 'MORNING' ? 'morning' : 'afternoon'} trip has been scheduled for ${scheduledAt.toLocaleDateString()}.`,
            userId: data.driverId,
            schoolId: data.schoolId,
            data: { tripId: trip.id, type: trip.type, scheduledAt: trip.scheduledAt } as any,
            sentAt: new Date(),
          },
        });
      }
    }

    return trip;
  }

  async startTrip(id: string, dto?: { notes?: string }) {
    const trip = await this.prisma.trip.findFirst({
      where: { id, deletedAt: null },
      include: {
        driver: { select: { id: true, firstName: true, lastName: true, email: true } },
        bus: { select: { id: true, plateNumber: true, busNumber: true } },
      },
    });
    if (!trip) throw new NotFoundException('Trip not found');
    if (trip.status !== 'SCHEDULED') {
      throw new BadRequestException('Trip must be in SCHEDULED status to start');
    }

    if (!trip.driverId) {
      throw new BadRequestException('Trip must have a driver assigned before starting');
    }
    if (!trip.busId) {
      throw new BadRequestException('Trip must have a bus assigned before starting');
    }

    const updatedTrip = await this.prisma.trip.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        startedAt: new Date(),
        notes: dto?.notes || trip.notes,
      },
      include: {
        driver: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        bus: { select: { id: true, plateNumber: true, busNumber: true } },
        route: { select: { id: true, name: true, code: true } },
        school: { select: { id: true, name: true } },
      },
    });

    const tripLabel = trip.type === 'MORNING' ? 'morning' : 'afternoon';
    this.notificationGateway.sendToUser(trip.driverId, 'trip:started', {
      tripId: id,
      type: trip.type,
      startedAt: updatedTrip.startedAt,
    });

    await this.prisma.notification.create({
      data: {
        type: 'TRIP_UPDATE',
        channel: 'WEBSOCKET',
        title: 'Trip Started',
        body: `The ${tripLabel} trip (${trip.bus?.plateNumber || 'N/A'}) has started.`,
        userId: trip.driverId,
        schoolId: trip.schoolId,
        data: { tripId: id, status: 'ACTIVE', startedAt: updatedTrip.startedAt } as any,
        sentAt: new Date(),
      },
    });

    if (trip.busId) {
      this.notificationGateway.sendToSchool(trip.schoolId, 'trip:started', {
        tripId: id,
        busId: trip.busId,
        busPlate: trip.bus?.plateNumber,
        type: trip.type,
        startedAt: updatedTrip.startedAt,
        driverName: trip.driver ? `${trip.driver.firstName} ${trip.driver.lastName}` : null,
      });
    }

    return updatedTrip;
  }

  async completeTrip(id: string, dto?: { notes?: string }) {
    const trip = await this.prisma.trip.findFirst({
      where: { id, deletedAt: null },
      include: {
        driver: { select: { id: true, firstName: true, lastName: true } },
        bus: { select: { id: true, plateNumber: true, busNumber: true } },
      },
    });
    if (!trip) throw new NotFoundException('Trip not found');
    if (trip.status !== 'ACTIVE') {
      throw new BadRequestException('Trip must be in ACTIVE status to complete');
    }

    const updatedTrip = await this.prisma.trip.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        notes: dto?.notes || trip.notes,
      },
      include: {
        driver: { select: { id: true, firstName: true, lastName: true, email: true } },
        bus: { select: { id: true, plateNumber: true, busNumber: true } },
        route: { select: { id: true, name: true, code: true } },
        school: { select: { id: true, name: true } },
        _count: { select: { tripEvents: true, attendance: true } },
      },
    });

    const tripLabel = trip.type === 'MORNING' ? 'morning' : 'afternoon';

    if (trip.driverId) {
      this.notificationGateway.sendToUser(trip.driverId, 'trip:completed', {
        tripId: id,
        type: trip.type,
        completedAt: updatedTrip.completedAt,
      });

      await this.prisma.notification.create({
        data: {
          type: 'TRIP_UPDATE',
          channel: 'WEBSOCKET',
          title: 'Trip Completed',
          body: `The ${tripLabel} trip (${trip.bus?.plateNumber || 'N/A'}) has been completed.`,
          userId: trip.driverId,
          schoolId: trip.schoolId,
          data: { tripId: id, status: 'COMPLETED', completedAt: updatedTrip.completedAt } as any,
          sentAt: new Date(),
        },
      });
    }

    this.notificationGateway.sendToSchool(trip.schoolId, 'trip:completed', {
      tripId: id,
      busId: trip.busId,
      type: trip.type,
      completedAt: updatedTrip.completedAt,
      eventCount: updatedTrip._count?.tripEvents || 0,
    });

    return updatedTrip;
  }

  async cancelTrip(id: string, reason?: string) {
    const trip = await this.prisma.trip.findFirst({
      where: { id, deletedAt: null },
      include: {
        driver: { select: { id: true, firstName: true, lastName: true } },
        bus: { select: { id: true, plateNumber: true, busNumber: true } },
      },
    });
    if (!trip) throw new NotFoundException('Trip not found');
    if (trip.status === 'COMPLETED') {
      throw new BadRequestException('Cannot cancel a trip that has already been completed');
    }
    if (trip.status === 'CANCELLED') {
      throw new BadRequestException('Trip has already been cancelled');
    }

    const updatedTrip = await this.prisma.trip.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelReason: reason || null,
      },
      include: {
        driver: { select: { id: true, firstName: true, lastName: true } },
        bus: { select: { id: true, plateNumber: true, busNumber: true } },
        route: { select: { id: true, name: true, code: true } },
        school: { select: { id: true, name: true } },
      },
    });

    const tripLabel = trip.type === 'MORNING' ? 'morning' : 'afternoon';

    if (trip.driverId) {
      this.notificationGateway.sendToUser(trip.driverId, 'trip:cancelled', {
        tripId: id,
        type: trip.type,
        reason: reason || null,
        cancelledAt: updatedTrip.cancelledAt,
      });

      await this.prisma.notification.create({
        data: {
          type: 'TRIP_UPDATE',
          channel: 'WEBSOCKET',
          title: 'Trip Cancelled',
          body: `The ${tripLabel} trip (${trip.bus?.plateNumber || 'N/A'}) has been cancelled.${reason ? ` Reason: ${reason}` : ''}`,
          userId: trip.driverId,
          schoolId: trip.schoolId,
          data: {
            tripId: id,
            status: 'CANCELLED',
            reason,
            cancelledAt: updatedTrip.cancelledAt,
          } as any,
          sentAt: new Date(),
        },
      });
    }

    this.notificationGateway.sendToSchool(trip.schoolId, 'trip:cancelled', {
      tripId: id,
      type: trip.type,
      reason: reason || null,
      cancelledAt: updatedTrip.cancelledAt,
    });

    return updatedTrip;
  }

  async update(
    id: string,
    data: Partial<{
      type: TripType;
      status: TripStatus;
      scheduledAt: string;
      notes: string;
      driverId: string;
      busId: string;
      routeId: string;
      assignmentId: string;
    }>,
  ) {
    const trip = await this.prisma.trip.findFirst({ where: { id, deletedAt: null } });
    if (!trip) throw new NotFoundException('Trip not found');

    const updateData: Record<string, unknown> = { ...data };
    if (data.scheduledAt) updateData.scheduledAt = new Date(data.scheduledAt);
    delete updateData.status;
    if (data.status && data.status !== trip.status) {
      throw new BadRequestException('Use startTrip/completeTrip/cancelTrip to change trip status');
    }

    return this.prisma.trip.update({
      where: { id },
      data: updateData,
      include: {
        driver: { select: { id: true, firstName: true, lastName: true } },
        bus: { select: { id: true, plateNumber: true, busNumber: true } },
        route: { select: { id: true, name: true, code: true } },
      },
    });
  }

  async softDelete(id: string): Promise<void> {
    const trip = await this.prisma.trip.findFirst({ where: { id, deletedAt: null } });
    if (!trip) throw new NotFoundException('Trip not found');
    await this.prisma.trip.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
