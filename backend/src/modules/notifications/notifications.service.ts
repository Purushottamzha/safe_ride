import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../database/prisma.service';
import { NotificationGateway } from './notification.gateway';
import { EmailService } from './email.service';
import { Prisma, NotificationType, NotificationChannel, DeliveryStatus } from '@prisma/client';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly MAX_RETRIES = 3;

  constructor(
    private prisma: PrismaService,
    private notificationGateway: NotificationGateway,
    private emailService: EmailService,
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
        deliveryStatus: DeliveryStatus.PENDING,
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
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

    this.dispatchByChannel(notification.id, data).catch((err) =>
      this.logger.error(`Channel dispatch failed: ${err.message}`),
    );

    return notification;
  }

  private async dispatchByChannel(
    notificationId: string,
    data: {
      type: NotificationType;
      channel: NotificationChannel;
      title: string;
      body: string;
      data?: Record<string, unknown>;
      userId?: string;
      schoolId?: string;
    },
  ) {
    if (data.channel === NotificationChannel.EMAIL) {
      await this.sendEmailDelivery(notificationId, data);
    } else if (data.channel === NotificationChannel.PUSH) {
      await this.sendPushDelivery(notificationId, data);
    } else if (data.channel === NotificationChannel.SMS) {
      await this.sendSmsDelivery(notificationId, data);
    } else {
      await this.updateDeliveryStatus(notificationId, DeliveryStatus.DELIVERED);
    }
  }

  private async sendEmailDelivery(
    notificationId: string,
    data: {
      type: NotificationType;
      title: string;
      body: string;
      data?: Record<string, unknown>;
      userId?: string;
    },
  ) {
    if (!data.userId) {
      await this.updateDeliveryStatus(notificationId, DeliveryStatus.FAILED, 'No userId');
      return;
    }

    try {
      const user = await this.prisma.user.findUnique({
        where: { id: data.userId },
        select: { email: true },
      });
      if (!user?.email) {
        await this.updateDeliveryStatus(notificationId, DeliveryStatus.FAILED, 'No email address');
        return;
      }

      const success = await this.emailService.sendEmail({
        to: user.email,
        subject: data.title,
        body: data.body,
        html: data.data?.htmlContent as string | undefined,
      });

      if (success) {
        await this.updateDeliveryStatus(notificationId, DeliveryStatus.SENT);
      } else {
        await this.markForRetry(notificationId, 'SMTP delivery failed');
      }
    } catch (error) {
      await this.markForRetry(notificationId, (error as Error).message);
    }
  }

  private async sendPushDelivery(
    notificationId: string,
    data: {
      type: NotificationType;
      title: string;
      body: string;
      data?: Record<string, unknown>;
      userId?: string;
    },
  ) {
    if (data.userId) {
      this.notificationGateway.sendToUser(data.userId, 'notification:push', {
        id: notificationId,
        title: data.title,
        body: data.body,
        type: data.type,
        data: data.data,
      });
      await this.updateDeliveryStatus(notificationId, DeliveryStatus.DELIVERED);
    } else {
      await this.updateDeliveryStatus(notificationId, DeliveryStatus.FAILED, 'No userId');
    }
  }

  private async sendSmsDelivery(
    notificationId: string,
    data: {
      type: NotificationType;
      title: string;
      body: string;
      userId?: string;
    },
  ) {
    if (!data.userId) {
      await this.updateDeliveryStatus(notificationId, DeliveryStatus.FAILED, 'No userId');
      return;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: data.userId },
      select: { phone: true },
    });
    if (!user?.phone) {
      await this.updateDeliveryStatus(notificationId, DeliveryStatus.FAILED, 'No phone number');
      return;
    }

    this.logger.log(`[SMS STUB] To: ${user.phone} | Body: ${data.body.substring(0, 100)}`);
    await this.markForRetry(notificationId, 'SMS gateway not configured');
  }

  private async updateDeliveryStatus(notificationId: string, status: DeliveryStatus, lastError?: string) {
    const updateData: any = { deliveryStatus: status };
    if (status === DeliveryStatus.SENT || status === DeliveryStatus.DELIVERED) {
      updateData.deliveredAt = new Date();
    }
    if (lastError) {
      updateData.lastError = lastError;
    }
    await this.prisma.notification.update({
      where: { id: notificationId },
      data: updateData,
    });
  }

  private async markForRetry(notificationId: string, error: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
      select: { retryCount: true },
    });
    const retryCount = (notification?.retryCount ?? 0) + 1;

    if (retryCount >= this.MAX_RETRIES) {
      await this.updateDeliveryStatus(notificationId, DeliveryStatus.FAILED, error);
    } else {
      await this.prisma.notification.update({
        where: { id: notificationId },
        data: { retryCount, lastError: error },
      });
    }
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async retryFailedDeliveries(): Promise<number> {
    const failed = await this.prisma.notification.findMany({
      where: {
        deliveryStatus: DeliveryStatus.FAILED,
        retryCount: { lt: this.MAX_RETRIES },
        channel: { in: [NotificationChannel.EMAIL, NotificationChannel.PUSH, NotificationChannel.SMS] },
      },
      take: 50,
    });

    for (const notification of failed) {
      await this.dispatchByChannel(notification.id, {
        type: notification.type as NotificationType,
        channel: notification.channel as NotificationChannel,
        title: notification.title,
        body: notification.body,
        data: (notification.data as Record<string, unknown>) || undefined,
        userId: notification.userId || undefined,
        schoolId: notification.schoolId || undefined,
      });
    }

    return failed.length;
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
        type: 'ATTENDANCE' as NotificationType,
        channel: 'IN_APP' as NotificationChannel,
        title,
        body,
        userId: parent.userId,
        schoolId: trip.schoolId,
        data: payload as any,
        sentAt: new Date(),
        deliveryStatus: DeliveryStatus.DELIVERED,
        deliveredAt: new Date(),
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
        type: 'TRIP_UPDATE' as NotificationType,
        channel: 'IN_APP' as NotificationChannel,
        title: config.title,
        body: config.body,
        userId: driver.id,
        schoolId: trip.schoolId,
        data: payload as any,
        sentAt: new Date(),
        deliveryStatus: DeliveryStatus.DELIVERED,
        deliveredAt: new Date(),
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
        type: 'INCIDENT' as NotificationType,
        channel: 'IN_APP' as NotificationChannel,
        title,
        body,
        schoolId,
        data: payload as any,
        sentAt: new Date(),
        deliveryStatus: DeliveryStatus.DELIVERED,
        deliveredAt: new Date(),
      },
    });
  }

  async softDelete(id: string): Promise<void> {
    const notification = await this.prisma.notification.findUnique({ where: { id } });
    if (!notification) throw new NotFoundException('Notification not found');
    await this.prisma.notification.delete({ where: { id } });
  }
}
