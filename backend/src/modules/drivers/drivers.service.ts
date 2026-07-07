import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class DriversService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: {
    page?: number;
    limit?: number;
    search?: string;
    schoolId?: string;
    isAvailable?: boolean;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.DriverWhereInput = { deletedAt: null };
    if (params.schoolId) where.schoolId = params.schoolId;
    if (params.isAvailable !== undefined) where.isAvailable = params.isAvailable;
    if (params.search) {
      where.OR = [
        { user: { firstName: { contains: params.search, mode: 'insensitive' } } },
        { user: { lastName: { contains: params.search, mode: 'insensitive' } } },
        { licenseNumber: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.driver.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              role: true,
              status: true,
            },
          },
          school: { select: { id: true, name: true } },
        },
      }),
      this.prisma.driver.count({ where }),
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
    const driver = await this.prisma.driver.findFirst({
      where: { id, deletedAt: null },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            role: true,
            status: true,
            profilePicture: true,
          },
        },
        school: { select: { id: true, name: true } },
      },
    });
    if (!driver) throw new NotFoundException('Driver not found');
    return driver;
  }

  async create(data: {
    userId: string;
    licenseNumber: string;
    licenseExpiry: string;
    emergencyContact?: string;
    medicalNotes?: string;
    schoolId: string;
  }) {
    const existing = await this.prisma.driver.findUnique({ where: { userId: data.userId } });
    if (existing) throw new ConflictException('Driver already exists for this user');

    const licenseExists = await this.prisma.driver.findUnique({
      where: { licenseNumber: data.licenseNumber },
    });
    if (licenseExists) throw new ConflictException('License number already exists');

    return this.prisma.driver.create({
      data: { ...data, licenseExpiry: new Date(data.licenseExpiry) },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        school: { select: { id: true, name: true } },
      },
    });
  }

  async update(
    id: string,
    data: Partial<{
      licenseNumber: string;
      licenseExpiry: string;
      isAvailable: boolean;
      emergencyContact: string;
      medicalNotes: string;
    }>,
  ) {
    const driver = await this.prisma.driver.findFirst({ where: { id, deletedAt: null } });
    if (!driver) throw new NotFoundException('Driver not found');

    const updateData: Record<string, unknown> = { ...data };
    if (data.licenseExpiry) updateData.licenseExpiry = new Date(data.licenseExpiry);

    if (data.licenseNumber && data.licenseNumber !== driver.licenseNumber) {
      const licenseExists = await this.prisma.driver.findUnique({
        where: { licenseNumber: data.licenseNumber },
      });
      if (licenseExists) throw new ConflictException('License number already exists');
    }

    return this.prisma.driver.update({ where: { id }, data: updateData });
  }

  async softDelete(id: string): Promise<void> {
    const driver = await this.prisma.driver.findFirst({ where: { id, deletedAt: null } });
    if (!driver) throw new NotFoundException('Driver not found');
    await this.prisma.driver.update({
      where: { id },
      data: { deletedAt: new Date(), isAvailable: false },
    });
  }
}
