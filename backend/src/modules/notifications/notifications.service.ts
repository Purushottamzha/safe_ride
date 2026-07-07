import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { NotificationGateway } from './notification.gateway';
import { Prisma, NotificationType, NotificationChannel } from '@prisma/client';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private notificationGateway: NotificationGateway,
  ) {}

  async findAll(params: {
    page?: number;
    limit?: number;
    userId?: string;
    schoolId?: string;
    isRead?: boolean;
    type?: NotificationType;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.NotificationWhereInput = {};
    if (params.userId) where.userId = params.userId;
    if (params.schoolId) where.schoolId = params.schoolId;
    if (params.isRead !== undefined) where.isRead = params.isRead;
    if (params.type) where.type = params.type;

    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      }),
      this.prisma.notification.count({ where }),
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

  async findById(id: string, requestingUserId?: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        school: { select: { id: true, name: true } },
      },
    });
    if (!notification) throw new NotFoundException('Notification not found');
    if (requestingUserId && notification.userId && notification.userId !== requestingUserId) {
      throw new ForbiddenException('You do not have access to this notification');
    }
    return notification;
  }

  async create(data: {
    type: NotificationType;
    channel: NotificationChannel;
    title: string;
    body: string;
    data?: Record<string, unknown>;
    userId?: string;
    schoolId?: string;
  }) {
    const notification = await this.prisma.notification.create({
      data: {
        type: data.type,
        channel: data.channel,
        title: data.title,
        body: data.body,
        data: (data.data || undefined) as any,
        userId: data.userId,
        schoolId: data.schoolId,
        sentAt: new Date(),
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (data.userId) {
      this.notificationGateway.sendToUser(data.userId, 'notification:new', {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        body: notification.body,
        data: notification.data as Record<string, unknown> | null,
        createdAt: notification.createdAt,
      });
    }

    return notification;
  }

  async markAsRead(id: string, userId?: string) {
    const notification = await this.prisma.notification.findUnique({ where: { id } });
    if (!notification) throw new NotFoundException('Notification not found');
    if (userId && notification.userId && notification.userId !== userId) {
      throw new ForbiddenException("You cannot mark another user's notification as read");
    }

    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllAsRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return { message: 'All notifications marked as read', count: result.count };
  }

  async getUnreadCount(userId: string) {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  async sendAttendanceNotification(
    student: { id: string; firstName: string; lastName: string },
    parent: { userId: string },
    scanType: 'BOARD_IN' | 'EXIT_OUT',
    trip: { id: string; type: string; schoolId: string },
  ) {
    const scanLabel = scanType === 'BOARD_IN' ? 'boarded' : 'exited';
    const tripLabel = trip.type === 'MORNING' ? 'morning' : 'afternoon';
    const title = scanType === 'BOARD_IN' ? 'Student Boarded Bus' : 'Student Exited Bus';
    const body = `${student.firstName} ${student.lastName} has ${scanLabel} the ${tripLabel} trip.`;

    const payload = {
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      tripId: trip.id,
      tripType: trip.type,
      scanType,
      timestamp: new Date().toISOString(),
    };

    this.notificationGateway.sendToUser(parent.userId, 'attendance:update', payload);

    return this.prisma.notification.create({
      data: {
        type: 'ATTENDANCE',
        channel: 'WEBSOCKET',
        title,
        body,
        userId: parent.userId,
        schoolId: trip.schoolId,
        data: payload as any,
        sentAt: new Date(),
      },
    });
  }

  async sendTripNotification(
    driver: { id: string; firstName?: string; lastName?: string },
    trip: { id: string; type: string; status: string; schoolId: string },
    event: 'created' | 'started' | 'completed' | 'cancelled',
  ) {
    const tripLabel = trip.type === 'MORNING' ? 'morning' : 'afternoon';

    const eventConfig: Record<string, { title: string; body: string; wsEvent: string }> = {
      created: {
        title: 'New Trip Scheduled',
        body: `A ${tripLabel} trip has been scheduled.`,
        wsEvent: 'trip:created',
      },
      started: {
        title: 'Trip Started',
        body: `The ${tripLabel} trip has started.`,
        wsEvent: 'trip:started',
      },
      completed: {
        title: 'Trip Completed',
        body: `The ${tripLabel} trip has been completed.`,
        wsEvent: 'trip:completed',
      },
      cancelled: {
        title: 'Trip Cancelled',
        body: `The ${tripLabel} trip has been cancelled.`,
        wsEvent: 'trip:cancelled',
      },
    };

    const config = eventConfig[event];
    if (!config) return null;

    const payload = {
      tripId: trip.id,
      tripType: trip.type,
      tripStatus: trip.status,
      event,
      timestamp: new Date().toISOString(),
    };

    this.notificationGateway.sendToUser(driver.id, config.wsEvent, payload);

    return this.prisma.notification.create({
      data: {
        type: 'TRIP_UPDATE',
        channel: 'WEBSOCKET',
        title: config.title,
        body: config.body,
        userId: driver.id,
        schoolId: trip.schoolId,
        data: payload as any,
        sentAt: new Date(),
      },
    });
  }

  async sendIncidentNotification(
    incident: { id: string; title: string; severity: string; description?: string },
    schoolId: string,
  ) {
    const title = `Incident Alert: ${incident.title}`;
    const body = `A ${incident.severity.toLowerCase()} severity incident has been reported: ${incident.description || incident.title}`;

    const payload = {
      incidentId: incident.id,
      title: incident.title,
      severity: incident.severity,
      timestamp: new Date().toISOString(),
    };

    this.notificationGateway.sendToSchool(schoolId, 'incident:alert', payload);

    return this.prisma.notification.create({
      data: {
        type: 'INCIDENT',
        channel: 'WEBSOCKET',
        title,
        body,
        schoolId,
        data: payload as any,
        sentAt: new Date(),
      },
    });
  }

  async softDelete(id: string): Promise<void> {
    const notification = await this.prisma.notification.findUnique({ where: { id } });
    if (!notification) throw new NotFoundException('Notification not found');
    await this.prisma.notification.delete({ where: { id } });
  }
}
