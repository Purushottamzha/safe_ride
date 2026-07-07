import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class StopsService {
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

    const where: Prisma.StopWhereInput = { deletedAt: null };
    if (params.schoolId) where.schoolId = params.schoolId;
    if (params.isActive !== undefined) where.isActive = params.isActive;
    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { address: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.stop.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: { school: { select: { id: true, name: true } } },
      }),
      this.prisma.stop.count({ where }),
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
    const stop = await this.prisma.stop.findFirst({
      where: { id, deletedAt: null },
      include: {
        school: { select: { id: true, name: true } },
        routeStops: { include: { route: { select: { id: true, name: true, code: true } } } },
      },
    });
    if (!stop) throw new NotFoundException('Stop not found');
    return stop;
  }

  async create(data: {
    name: string;
    address: string;
    latitude?: number;
    longitude?: number;
    sequence?: number;
    isActive?: boolean;
    schoolId: string;
  }) {
    return this.prisma.stop.create({ data });
  }

  async update(
    id: string,
    data: Partial<{
      name: string;
      address: string;
      latitude: number;
      longitude: number;
      sequence: number;
      isActive: boolean;
    }>,
  ) {
    const stop = await this.prisma.stop.findFirst({ where: { id, deletedAt: null } });
    if (!stop) throw new NotFoundException('Stop not found');
    return this.prisma.stop.update({ where: { id }, data });
  }

  async softDelete(id: string): Promise<void> {
    const stop = await this.prisma.stop.findFirst({ where: { id, deletedAt: null } });
    if (!stop) throw new NotFoundException('Stop not found');
    await this.prisma.stop.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }
}
