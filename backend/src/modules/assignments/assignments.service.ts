import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AssignmentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: { page?: number; limit?: number; schoolId?: string; routeId?: string; isActive?: boolean }) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.AssignmentWhereInput = { deletedAt: null };
    if (params.schoolId) where.schoolId = params.schoolId;
    if (params.routeId) where.routeId = params.routeId;
    if (params.isActive !== undefined) where.isActive = params.isActive;

    const [data, total] = await Promise.all([
      this.prisma.assignment.findMany({
        where, skip, take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          school: { select: { id: true, name: true } },
          route: { select: { id: true, name: true, code: true } },
          driverAssignments: {
            include: { driver: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } } } },
          },
          busAssignments: {
            include: { bus: { select: { id: true, plateNumber: true, busNumber: true } } },
          },
          studentAssignments: {
            include: { student: { select: { id: true, firstName: true, lastName: true, studentId: true } } },
            take: 20,
          },
          _count: { select: { driverAssignments: true, busAssignments: true, studentAssignments: true } },
        },
      }),
      this.prisma.assignment.count({ where }),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit), hasNextPage: page * limit < total, hasPreviousPage: page > 1 },
    };
  }

  async findById(id: string) {
    const assignment = await this.prisma.assignment.findFirst({
      where: { id, deletedAt: null },
      include: {
        school: { select: { id: true, name: true } },
        route: { select: { id: true, name: true, code: true, direction: true } },
        driverAssignments: {
          include: { driver: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } } } } },
        },
        busAssignments: {
          include: { bus: { select: { id: true, plateNumber: true, busNumber: true, capacity: true } } },
        },
        studentAssignments: {
          include: { student: { select: { id: true, firstName: true, lastName: true, studentId: true, grade: true, section: true } }, stop: { select: { id: true, name: true } } },
        },
      },
    });
    if (!assignment) throw new NotFoundException('Assignment not found');
    return assignment;
  }

  async create(data: { name?: string; schoolId: string; routeId: string; isActive?: boolean }) {
    return this.prisma.assignment.create({
      data,
      include: {
        school: { select: { id: true, name: true } },
        route: { select: { id: true, name: true, code: true } },
      },
    });
  }

  async update(id: string, data: { name?: string; routeId?: string; isActive?: boolean }) {
    const assignment = await this.prisma.assignment.findFirst({ where: { id, deletedAt: null } });
    if (!assignment) throw new NotFoundException('Assignment not found');
    return this.prisma.assignment.update({ where: { id }, data });
  }

  async addDriver(assignmentId: string, driverId: string, isPrimary?: boolean) {
    const assignment = await this.prisma.assignment.findFirst({ where: { id: assignmentId, deletedAt: null } });
    if (!assignment) throw new NotFoundException('Assignment not found');

    return this.prisma.driverAssignment.create({
      data: { assignmentId, driverId, isPrimary: isPrimary ?? true },
      include: { driver: { include: { user: { select: { id: true, firstName: true, lastName: true } } } } },
    });
  }

  async removeDriver(assignmentId: string, driverId: string) {
    const link = await this.prisma.driverAssignment.findFirst({ where: { assignmentId, driverId } });
    if (!link) throw new NotFoundException('Driver assignment not found');
    await this.prisma.driverAssignment.delete({ where: { id: link.id } });
  }

  async addBus(assignmentId: string, busId: string, isPrimary?: boolean) {
    const assignment = await this.prisma.assignment.findFirst({ where: { id: assignmentId, deletedAt: null } });
    if (!assignment) throw new NotFoundException('Assignment not found');

    return this.prisma.busAssignment.create({
      data: { assignmentId, busId, isPrimary: isPrimary ?? true },
      include: { bus: { select: { id: true, plateNumber: true, busNumber: true } } },
    });
  }

  async removeBus(assignmentId: string, busId: string) {
    const link = await this.prisma.busAssignment.findFirst({ where: { assignmentId, busId } });
    if (!link) throw new NotFoundException('Bus assignment not found');
    await this.prisma.busAssignment.delete({ where: { id: link.id } });
  }

  async addStudent(assignmentId: string, studentId: string, stopId?: string) {
    const assignment = await this.prisma.assignment.findFirst({ where: { id: assignmentId, deletedAt: null } });
    if (!assignment) throw new NotFoundException('Assignment not found');

    return this.prisma.studentAssignment.create({
      data: { assignmentId, studentId, stopId },
      include: { student: { select: { id: true, firstName: true, lastName: true, studentId: true } } },
    });
  }

  async removeStudent(assignmentId: string, studentId: string) {
    const link = await this.prisma.studentAssignment.findFirst({ where: { assignmentId, studentId } });
    if (!link) throw new NotFoundException('Student assignment not found');
    await this.prisma.studentAssignment.delete({ where: { id: link.id } });
  }

  async softDelete(id: string): Promise<void> {
    const assignment = await this.prisma.assignment.findFirst({ where: { id, deletedAt: null } });
    if (!assignment) throw new NotFoundException('Assignment not found');
    await this.prisma.assignment.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
  }
}
