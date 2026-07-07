/**
 * TODO — Data retention & parental consent (Group C):
 * Student photos, QR tokens, and attendance records are PII.
 * Before any non-demo deployment, capture explicit parental consent
 * at registration time and implement a scheduled purge policy.
 * See /docs/device-registry.md for details.
 */
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: {
    page?: number;
    limit?: number;
    search?: string;
    schoolId?: string;
    grade?: string;
    section?: string;
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
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          school: { select: { id: true, name: true } },
          parentStudents: {
            include: {
              parent: {
                include: {
                  user: { select: { id: true, firstName: true, lastName: true, email: true } },
                },
              },
            },
          },
        },
      }),
      this.prisma.student.count({ where }),
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
    const student = await this.prisma.student.findFirst({
      where: { id, deletedAt: null },
      include: {
        school: { select: { id: true, name: true } },
        parentStudents: {
          include: {
            parent: {
              include: {
                user: {
                  select: { id: true, firstName: true, lastName: true, email: true, phone: true },
                },
              },
            },
          },
        },
        studentAssignments: { include: { assignment: { include: { route: true } } } },
      },
    });
    if (!student) throw new NotFoundException('Student not found');
    return student;
  }

  async create(data: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    grade: string;
    section?: string;
    address: string;
    phone?: string;
    schoolId: string;
    emergencyNotes?: string;
    profilePicture?: string;
  }) {
    const dob = new Date(data.dateOfBirth);
    if (isNaN(dob.getTime())) throw new BadRequestException('Invalid dateOfBirth format');
    if (dob > new Date()) throw new BadRequestException('Date of birth cannot be in the future');

    const studentId = `STU-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    const qrToken = crypto.randomBytes(32).toString('hex');
    const qrExpiresAt = this.calculateTermEndDate();

    if (data.profilePicture) {
      this.validateImagePayload(data.profilePicture);
    }

    return this.prisma.student.create({
      data: {
        ...data,
        dateOfBirth: dob,
        studentId,
        qrToken,
        qrExpiresAt,
        profilePicture: data.profilePicture || null,
      },
    });
  }

  async update(
    id: string,
    data: Partial<{
      firstName: string;
      lastName: string;
      dateOfBirth: string;
      grade: string;
      section: string;
      address: string;
      phone: string;
      isActive: boolean;
      emergencyNotes: string;
      profilePicture: string;
    }>,
  ) {
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
    const qrExpiresAt = this.calculateTermEndDate();

    return this.prisma.student.update({
      where: { id },
      data: { qrToken, qrExpiresAt },
      select: { id: true, studentId: true, qrToken: true, qrExpiresAt: true },
    });
  }

  private validateImagePayload(base64Payload: string) {
    const raw = base64Payload.replace(/^data:[^;]+;base64,/, '');
    const sizeBytes = Math.ceil((raw.length * 3) / 4);
    const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;
    const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp'];

    if (sizeBytes > MAX_IMAGE_SIZE_BYTES) {
      throw new BadRequestException(
        `Profile image exceeds 2MB limit (${(sizeBytes / (1024 * 1024)).toFixed(1)}MB detected)`,
      );
    }

    const mimeMatch = base64Payload.match(/^data:([^;]+);base64,/);
    if (mimeMatch && !ALLOWED_IMAGE_MIMES.includes(mimeMatch[1])) {
      throw new BadRequestException(`Unsupported image type "${mimeMatch[1]}". Allowed: ${ALLOWED_IMAGE_MIMES.join(', ')}`);
    }
  }

  private calculateTermEndDate(): Date {
    const now = new Date();
    const june30ThisYear = new Date(now.getFullYear(), 5, 30, 23, 59, 59);
    if (now <= june30ThisYear) {
      return june30ThisYear;
    }
    return new Date(now.getFullYear() + 1, 5, 30, 23, 59, 59);
  }

  async softDelete(id: string): Promise<void> {
    const student = await this.prisma.student.findFirst({ where: { id, deletedAt: null } });
    if (!student) throw new NotFoundException('Student not found');
    await this.prisma.student.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }
}
