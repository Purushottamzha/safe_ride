import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma, IncidentSeverity, IncidentStatus } from '@prisma/client';

@Injectable()
export class IncidentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: {
    page?: number; limit?: number; severity?: IncidentSeverity;
    status?: IncidentStatus; reportedById?: string; tripId?: string;
    schoolId?: string; startDate?: string; endDate?: string;
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
        where, skip, take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          reportedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
          trip: { select: { id: true, type: true, status: true } },
          student: { select: { id: true, firstName: true, lastName: true, studentId: true } },
          bus: { select: { id: true, plateNumber: true, busNumber: true } },
        },
      }),
      this.prisma.incident.count({ where }),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit), hasNextPage: page * limit < total, hasPreviousPage: page > 1 },
    };
  }

  async findById(id: string) {
    const incident = await this.prisma.incident.findFirst({
      where: { id, deletedAt: null },
      include: {
        reportedBy: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
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
    title: string; description: string; severity?: IncidentSeverity;
    latitude?: number; longitude?: number; location?: string;
    reportedById: string; tripId?: string; studentId?: string;
    busId?: string; imageUrls?: string[];
  }) {
    return this.prisma.incident.create({
      data,
      include: {
        reportedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async update(id: string, data: Partial<{
    title: string; description: string; severity: IncidentSeverity;
    latitude: number; longitude: number; location: string;
    imageUrls: string[];
  }>) {
    const incident = await this.prisma.incident.findFirst({ where: { id, deletedAt: null } });
    if (!incident) throw new NotFoundException('Incident not found');
    return this.prisma.incident.update({ where: { id }, data });
  }

  async resolve(id: string, resolution: string, resolvedById: string) {
    const incident = await this.prisma.incident.findFirst({ where: { id, deletedAt: null } });
    if (!incident) throw new NotFoundException('Incident not found');

    return this.prisma.incident.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        resolution,
        resolvedById,
        resolvedAt: new Date(),
      },
    });
  }

  async softDelete(id: string): Promise<void> {
    const incident = await this.prisma.incident.findFirst({ where: { id, deletedAt: null } });
    if (!incident) throw new NotFoundException('Incident not found');
    await this.prisma.incident.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
