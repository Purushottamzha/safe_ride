import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma, BusStatus } from '@prisma/client';

@Injectable()
export class BusesService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: {
    page?: number;
    limit?: number;
    search?: string;
    schoolId?: string;
    status?: BusStatus;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.BusWhereInput = { deletedAt: null };
    if (params.schoolId) where.schoolId = params.schoolId;
    if (params.status) where.status = params.status;
    if (params.search) {
      where.OR = [
        { plateNumber: { contains: params.search, mode: 'insensitive' } },
        { busNumber: { contains: params.search, mode: 'insensitive' } },
        { model: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.bus.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { school: { select: { id: true, name: true } } },
      }),
      this.prisma.bus.count({ where }),
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
    const bus = await this.prisma.bus.findFirst({
      where: { id, deletedAt: null },
      include: { school: { select: { id: true, name: true } } },
    });
    if (!bus) throw new NotFoundException('Bus not found');
    return bus;
  }

  async create(data: {
    plateNumber: string;
    busNumber: string;
    model?: string;
    capacity: number;
    year?: number;
    color?: string;
    status?: BusStatus;
    gpsDeviceId?: string;
    cameraDeviceId?: string;
    schoolId: string;
  }) {
    const existing = await this.prisma.bus.findUnique({ where: { plateNumber: data.plateNumber } });
    if (existing) throw new ConflictException('Bus with this plate number already exists');

    return this.prisma.bus.create({ data });
  }

  async update(
    id: string,
    data: Partial<{
      plateNumber: string;
      busNumber: string;
      model: string;
      capacity: number;
      year: number;
      color: string;
      status: BusStatus;
      gpsDeviceId: string;
      cameraDeviceId: string;
      lastGpsLat: number;
      lastGpsLng: number;
      lastGpsUpdate: string;
    }>,
  ) {
    const bus = await this.prisma.bus.findFirst({ where: { id, deletedAt: null } });
    if (!bus) throw new NotFoundException('Bus not found');

    const updateData: Record<string, unknown> = { ...data };
    if (data.lastGpsUpdate) updateData.lastGpsUpdate = new Date(data.lastGpsUpdate);

    if (data.plateNumber && data.plateNumber !== bus.plateNumber) {
      const existing = await this.prisma.bus.findUnique({
        where: { plateNumber: data.plateNumber },
      });
      if (existing) throw new ConflictException('Bus with this plate number already exists');
    }

    return this.prisma.bus.update({ where: { id }, data: updateData });
  }

  async softDelete(id: string): Promise<void> {
    const bus = await this.prisma.bus.findFirst({ where: { id, deletedAt: null } });
    if (!bus) throw new NotFoundException('Bus not found');
    await this.prisma.bus.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'INACTIVE' },
    });
  }
}
