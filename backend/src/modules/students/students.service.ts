import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: {
    page?: number; limit?: number; search?: string;
    schoolId?: string; grade?: string; section?: string;
    isActive?: boolean;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.StudentWhereInput = { deletedAt: null };
    if (params.schoolId) where.schoolId = params.schoolId;
    if (params.grade) where.grade = params.grade;
    if (params.section) where.section = params.section;
    if (params.isActive !== undefined) where.isActive = params.isActive;
    if (params.search) {
      where.OR = [
        { firstName: { contains: params.search, mode: 'insensitive' } },
        { lastName: { contains: params.search, mode: 'insensitive' } },
        { studentId: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.student.findMany({
        where, skip, take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          school: { select: { id: true, name: true } },
          parentStudents: {
            include: { parent: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } } } },
          },
        },
      }),
      this.prisma.student.count({ where }),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit), hasNextPage: page * limit < total, hasPreviousPage: page > 1 },
    };
  }

  async findById(id: string) {
    const student = await this.prisma.student.findFirst({
      where: { id, deletedAt: null },
      include: {
        school: { select: { id: true, name: true } },
        parentStudents: {
          include: { parent: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } } } } },
        },
        studentAssignments: { include: { assignment: { include: { route: true } } } },
      },
    });
    if (!student) throw new NotFoundException('Student not found');
    return student;
  }

  async create(data: {
    firstName: string; lastName: string; dateOfBirth: string;
    grade: string; section?: string; address: string;
    phone?: string; schoolId: string; emergencyNotes?: string;
  }) {
    const studentId = `STU-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    const qrToken = crypto.randomBytes(32).toString('hex');
    const qrExpiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

    return this.prisma.student.create({
      data: {
        ...data,
        dateOfBirth: new Date(data.dateOfBirth),
        studentId,
        qrToken,
        qrExpiresAt,
      },
    });
  }

  async update(id: string, data: Partial<{
    firstName: string; lastName: string; dateOfBirth: string;
    grade: string; section: string; address: string;
    phone: string; isActive: boolean; emergencyNotes: string;
    profilePicture: string;
  }>) {
    const student = await this.prisma.student.findFirst({ where: { id, deletedAt: null } });
    if (!student) throw new NotFoundException('Student not found');

    const updateData: Record<string, unknown> = { ...data };
    if (data.dateOfBirth) updateData.dateOfBirth = new Date(data.dateOfBirth);

    return this.prisma.student.update({ where: { id }, data: updateData });
  }

  async regenerateQR(id: string) {
    const student = await this.prisma.student.findFirst({ where: { id, deletedAt: null } });
    if (!student) throw new NotFoundException('Student not found');

    const qrToken = crypto.randomBytes(32).toString('hex');
    const qrExpiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

    return this.prisma.student.update({
      where: { id },
      data: { qrToken, qrExpiresAt },
      select: { id: true, studentId: true, qrToken: true, qrExpiresAt: true },
    });
  }

  async softDelete(id: string): Promise<void> {
    const student = await this.prisma.student.findFirst({ where: { id, deletedAt: null } });
    if (!student) throw new NotFoundException('Student not found');
    await this.prisma.student.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
  }
}
