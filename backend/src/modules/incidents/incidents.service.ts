import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { NotificationGateway } from '../notifications/notification.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { Prisma, IncidentSeverity, IncidentStatus } from '@prisma/client';

@Injectable()
export class IncidentsService {
  private readonly logger = new Logger(IncidentsService.name);

  constructor(
    private prisma: PrismaService,
    private notificationGateway: NotificationGateway,
    private notificationsService: NotificationsService,
  ) {}

  async findAll(params: {
    page?: number;
    limit?: number;
    severity?: IncidentSeverity;
    status?: IncidentStatus;
    reportedById?: string;
    tripId?: string;
    schoolId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.IncidentWhereInput = { deletedAt: null };
    if (params.severity) where.severity = params.severity;
    if (params.status) where.status = params.status;
    if (params.reportedById) where.reportedById = params.reportedById;
    if (params.tripId) where.tripId = params.tripId;
    if (params.startDate || params.endDate) {
      where.createdAt = {};
      if (params.startDate) where.createdAt.gte = new Date(params.startDate);
      if (params.endDate) where.createdAt.lte = new Date(params.endDate);
    }

    const [data, total] = await Promise.all([
      this.prisma.incident.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          reportedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
          assignedTo: { select: { id: true, firstName: true, lastName: true } },
          resolvedBy: { select: { id: true, firstName: true, lastName: true } },
          trip: { select: { id: true, type: true, status: true } },
          student: { select: { id: true, firstName: true, lastName: true, studentId: true } },
          bus: { select: { id: true, plateNumber: true, busNumber: true } },
        },
      }),
      this.prisma.incident.count({ where }),
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
    const incident = await this.prisma.incident.findFirst({
      where: { id, deletedAt: null },
      include: {
        reportedBy: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true },
        },
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        resolvedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        trip: { select: { id: true, type: true, status: true, scheduledAt: true } },
        student: { select: { id: true, firstName: true, lastName: true, studentId: true } },
        bus: { select: { id: true, plateNumber: true, busNumber: true } },
      },
    });
    if (!incident) throw new NotFoundException('Incident not found');
    return incident;
  }

  async create(data: {
    title: string;
    description: string;
    severity?: IncidentSeverity;
    latitude?: number;
    longitude?: number;
    location?: string;
    reportedById: string;
    tripId?: string;
    studentId?: string;
    busId?: string;
    imageUrls?: string[];
  }) {
    const incident = await this.prisma.incident.create({
      data,
      include: {
        reportedBy: { select: { id: true, firstName: true, lastName: true } },
        bus: { select: { id: true, busNumber: true, plateNumber: true, schoolId: true } },
        trip: { select: { id: true, schoolId: true } },
      },
    });

    const schoolId = incident.bus?.schoolId || incident.trip?.schoolId;

    this.notificationGateway.sendToSchool(schoolId || '', 'incident:alert', {
      id: incident.id,
      title: incident.title,
      severity: incident.severity,
      description: incident.description,
      latitude: incident.latitude,
      longitude: incident.longitude,
      busId: incident.busId,
      busNumber: incident.bus?.busNumber,
      timestamp: incident.createdAt,
    });

    try {
      await this.notificationsService.sendIncidentNotification(
        {
          id: incident.id,
          title: incident.title,
          severity: incident.severity,
          description: incident.description,
        },
        schoolId || '',
      );
    } catch (error) {
      this.logger.error(`Failed to send incident notification: ${(error as Error).message}`);
    }

    return incident;
  }

  async update(
    id: string,
    data: Partial<{
      title: string;
      description: string;
      severity: IncidentSeverity;
      latitude: number;
      longitude: number;
      location: string;
      imageUrls: string[];
    }>,
  ) {
    const incident = await this.prisma.incident.findFirst({ where: { id, deletedAt: null } });
    if (!incident) throw new NotFoundException('Incident not found');
    return this.prisma.incident.update({ where: { id }, data });
  }

  async assign(id: string, assignedToId: string) {
    const incident = await this.prisma.incident.findFirst({ where: { id, deletedAt: null } });
    if (!incident) throw new NotFoundException('Incident not found');

    const updated = await this.prisma.incident.update({
      where: { id },
      data: { assignedToId },
      include: {
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (updated.assignedTo) {
      this.notificationGateway.sendToUser(assignedToId, 'incident:assigned', {
        id: updated.id,
        title: updated.title,
        severity: updated.severity,
        timestamp: new Date().toISOString(),
      });
    }

    return updated;
  }

  async resolve(id: string, resolution: string, resolvedById: string) {
    const incident = await this.prisma.incident.findFirst({ where: { id, deletedAt: null } });
    if (!incident) throw new NotFoundException('Incident not found');

    const updated = await this.prisma.incident.update({
      where: { id },
      data: {
        status: 'RESOLVED' as IncidentStatus,
        resolution,
        resolvedById,
        resolvedAt: new Date(),
      },
      include: {
        bus: { select: { schoolId: true } },
      },
    });

    this.notificationGateway.sendToSchool(updated.bus?.schoolId || '', 'incident:resolved', {
      id: updated.id,
      title: updated.title,
      resolution: updated.resolution,
      timestamp: updated.resolvedAt,
    });

    return updated;
  }

  async softDelete(id: string): Promise<void> {
    const incident = await this.prisma.incident.findFirst({ where: { id, deletedAt: null } });
    if (!incident) throw new NotFoundException('Incident not found');
    await this.prisma.incident.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
