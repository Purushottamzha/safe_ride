import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '@prisma/client';

interface LogParams {
  action: string;
  entity: string;
  entityId?: string;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  schoolId?: string;
  oldValues?: unknown;
  newValues?: unknown;
  ipAddress?: string;
  userAgent?: string;
}

interface FindAllParams {
  page?: number;
  limit?: number;
  action?: string;
  entity?: string;
  userId?: string;
  schoolId?: string;
  startDate?: string;
  endDate?: string;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(params: LogParams): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        userId: params.userId,
        userEmail: params.userEmail,
        userRole: params.userRole,
        schoolId: params.schoolId,
        oldValues: params.oldValues as Prisma.InputJsonValue,
        newValues: params.newValues as Prisma.InputJsonValue,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
  }

  async findAll(params: FindAllParams) {
    const { page = 1, limit = 20, action, entity, userId, schoolId, startDate, endDate } = params;

    const where: Prisma.AuditLogWhereInput = {};

    if (action) where.action = { contains: action, mode: 'insensitive' };
    if (entity) where.entity = { equals: entity, mode: 'insensitive' };
    if (userId) where.userId = userId;
    if (schoolId) where.schoolId = schoolId;
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate);
      if (endDate) where.timestamp.lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { timestamp: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
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
    return this.prisma.auditLog.findUniqueOrThrow({ where: { id } });
  }
}
