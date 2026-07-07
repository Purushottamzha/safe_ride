import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class SchoolsService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: { page?: number; limit?: number; search?: string }) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.SchoolWhereInput = { deletedAt: null };
    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { code: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.school.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.school.count({ where }),
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
    const school = await this.prisma.school.findFirst({
      where: { id, deletedAt: null },
      include: {
        _count: {
          select: { users: true, students: true, drivers: true, buses: true, routes: true },
        },
      },
    });
    if (!school) throw new NotFoundException('School not found');
    return school;
  }

  async create(data: {
    name: string;
    code: string;
    address: string;
    phone: string;
    email: string;
    website?: string;
    timezone?: string;
  }) {
    const existing = await this.prisma.school.findUnique({ where: { code: data.code } });
    if (existing) throw new ConflictException('School code already exists');

    return this.prisma.school.create({ data });
  }

  async update(
    id: string,
    data: Partial<{
      name: string;
      code: string;
      address: string;
      phone: string;
      email: string;
      website: string;
      timezone: string;
      isActive: boolean;
    }>,
  ) {
    const school = await this.prisma.school.findFirst({ where: { id, deletedAt: null } });
    if (!school) throw new NotFoundException('School not found');

    if (data.code && data.code !== school.code) {
      const existing = await this.prisma.school.findUnique({ where: { code: data.code } });
      if (existing) throw new ConflictException('School code already exists');
    }

    return this.prisma.school.update({ where: { id }, data });
  }

  async softDelete(id: string): Promise<void> {
    const school = await this.prisma.school.findFirst({ where: { id, deletedAt: null } });
    if (!school) throw new NotFoundException('School not found');
    await this.prisma.school.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }
}
