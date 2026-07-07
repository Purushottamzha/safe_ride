import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class RoutesService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: {
    page?: number;
    limit?: number;
    search?: string;
    schoolId?: string;
    isActive?: boolean;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.RouteWhereInput = { deletedAt: null };
    if (params.schoolId) where.schoolId = params.schoolId;
    if (params.isActive !== undefined) where.isActive = params.isActive;
    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { code: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.route.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          school: { select: { id: true, name: true } },
          routeStops: {
            include: { stop: true },
            orderBy: { sequence: 'asc' },
          },
        },
      }),
      this.prisma.route.count({ where }),
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
    const route = await this.prisma.route.findFirst({
      where: { id, deletedAt: null },
      include: {
        school: { select: { id: true, name: true } },
        routeStops: {
          include: { stop: true },
          orderBy: { sequence: 'asc' },
        },
      },
    });
    if (!route) throw new NotFoundException('Route not found');
    return route;
  }

  async create(data: {
    name: string;
    code: string;
    direction?: string;
    distance?: number;
    duration?: number;
    isActive?: boolean;
    schoolId: string;
  }) {
    const existing = await this.prisma.route.findUnique({ where: { code: data.code } });
    if (existing) throw new ConflictException('Route code already exists');

    return this.prisma.route.create({ data });
  }

  async update(
    id: string,
    data: Partial<{
      name: string;
      code: string;
      direction: string;
      distance: number;
      duration: number;
      isActive: boolean;
    }>,
  ) {
    const route = await this.prisma.route.findFirst({ where: { id, deletedAt: null } });
    if (!route) throw new NotFoundException('Route not found');

    if (data.code && data.code !== route.code) {
      const existing = await this.prisma.route.findUnique({ where: { code: data.code } });
      if (existing) throw new ConflictException('Route code already exists');
    }

    return this.prisma.route.update({ where: { id }, data });
  }

  async addStop(
    routeId: string,
    stopId: string,
    sequence: number,
    distance?: number,
    duration?: number,
  ) {
    const route = await this.prisma.route.findFirst({ where: { id: routeId, deletedAt: null } });
    if (!route) throw new NotFoundException('Route not found');

    const stop = await this.prisma.stop.findFirst({ where: { id: stopId, deletedAt: null } });
    if (!stop) throw new NotFoundException('Stop not found');

    return this.prisma.routeStop.create({
      data: { routeId, stopId, sequence, distance, duration },
      include: { stop: true },
    });
  }

  async removeStop(routeId: string, stopId: string) {
    const routeStop = await this.prisma.routeStop.findUnique({
      where: { routeId_stopId: { routeId, stopId } },
    });
    if (!routeStop) throw new NotFoundException('Route stop not found');

    await this.prisma.routeStop.delete({
      where: { routeId_stopId: { routeId, stopId } },
    });
  }

  async softDelete(id: string): Promise<void> {
    const route = await this.prisma.route.findFirst({ where: { id, deletedAt: null } });
    if (!route) throw new NotFoundException('Route not found');
    await this.prisma.route.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }
}
