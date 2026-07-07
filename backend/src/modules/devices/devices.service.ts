import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class DevicesService {
  constructor(private prisma: PrismaService) {}

  async register(data: {
    name: string;
    type: 'WEBCAM_DEMO' | 'ESP32_CAM' | 'ESP32_GPS';
    busId?: string;
    schoolId?: string;
    firmwareVersion?: string;
  }) {
    const apiKey = crypto.randomBytes(32).toString('hex');
    const apiKeyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

    const device = await this.prisma.device.create({
      data: {
        name: data.name,
        apiKeyHash,
        type: data.type,
        busId: data.busId || null,
        schoolId: data.schoolId || null,
        firmwareVersion: data.firmwareVersion || null,
      },
    });

    return {
      id: device.id,
      name: device.name,
      type: device.type,
      busId: device.busId,
      apiKey,
      message: 'Save this API key — it will not be shown again.',
    };
  }

  async findAll(params: { page?: number; limit?: number; schoolId?: string }) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = {};
    if (params.schoolId) where.schoolId = params.schoolId;

    const [data, total] = await Promise.all([
      this.prisma.device.findMany({
        where: where as never,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          bus: { select: { id: true, busNumber: true, plateNumber: true } },
          school: { select: { id: true, name: true } },
        },
      }),
      this.prisma.device.count({ where: where as never }),
    ]);

    return {
      data: data.map((d) => ({ ...d, apiKeyHash: undefined })),
      meta: {
        page, limit, total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findById(id: string) {
    const device = await this.prisma.device.findUnique({
      where: { id },
      include: {
        bus: { select: { id: true, busNumber: true, plateNumber: true } },
        school: { select: { id: true, name: true } },
      },
    });
    if (!device) throw new NotFoundException('Device not found');
    const { apiKeyHash, ...rest } = device;
    return rest;
  }

  async updateStatus(id: string, status: 'ACTIVE' | 'INACTIVE' | 'ERROR') {
    const device = await this.prisma.device.findUnique({ where: { id } });
    if (!device) throw new NotFoundException('Device not found');
    return this.prisma.device.update({
      where: { id },
      data: { status },
      select: { id: true, name: true, type: true, status: true, lastSeenAt: true },
    });
  }

  async rotateApiKey(id: string) {
    const device = await this.prisma.device.findUnique({ where: { id } });
    if (!device) throw new NotFoundException('Device not found');

    const apiKey = crypto.randomBytes(32).toString('hex');
    const apiKeyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

    await this.prisma.device.update({
      where: { id },
      data: { apiKeyHash },
    });

    return {
      id,
      apiKey,
      message: 'Old key is immediately invalid. Save this new key.',
    };
  }
}
