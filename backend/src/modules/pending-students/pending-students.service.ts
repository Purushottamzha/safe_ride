/**
 * TODO — Data retention & parental consent (Group C):
 * Student photos, QR tokens, and attendance records are PII.
 * Before any non-demo deployment, capture explicit parental consent
 * at registration time and implement a scheduled purge policy.
 * See /docs/device-registry.md for details.
 */
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { NotificationGateway } from '../notifications/notification.gateway';
import { NotificationRulesService } from '../notifications/notification-rules.service';
import * as crypto from 'crypto';

const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;
const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp'];

@Injectable()
export class PendingStudentsService {
  constructor(
    private prisma: PrismaService,
    private notificationGateway: NotificationGateway,
    private notificationRules: NotificationRulesService,
  ) {}

  async submitRegistration(data: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    grade: string;
    section?: string;
    address: string;
    phone?: string;
    profilePicture?: string;
    schoolId: string;
    parentId: string;
  }) {
    const dob = new Date(data.dateOfBirth);
    if (isNaN(dob.getTime())) {
      throw new BadRequestException('Invalid dateOfBirth format');
    }
    if (dob > new Date()) {
      throw new BadRequestException('Date of birth cannot be in the future');
    }

    if (data.profilePicture) {
      this.validateImagePayload(data.profilePicture);
    }

    const existing = await this.findExistingRegistration(
      data.firstName, data.lastName, dob, data.schoolId,
    );
    if (existing) {
      const label = existing.status === 'PENDING' ? 'already has a pending registration' : 'is already registered or was previously processed';
      throw new BadRequestException(
        `A student with the name "${data.firstName} ${data.lastName}" matching this date of birth and school ${label}.`,
      );
    }

    return this.prisma.pendingStudentRequest.create({
      data: {
        ...data,
        dateOfBirth: dob,
        profilePicture: data.profilePicture || null,
      },
      include: {
        school: { select: { id: true, name: true } },
        parent: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
        },
      },
    });
  }

  private async findExistingRegistration(firstName: string, lastName: string, dateOfBirth: Date, schoolId: string) {
    const pending = await this.prisma.pendingStudentRequest.findFirst({
      where: {
        firstName,
        lastName,
        dateOfBirth,
        schoolId,
        status: { in: ['PENDING', 'APPROVED'] },
      },
    });
    if (pending) return pending;

    const student = await this.prisma.student.findFirst({
      where: {
        firstName,
        lastName,
        dateOfBirth,
        schoolId,
        deletedAt: null,
      },
    });
    return student ? { status: 'APPROVED' as const } : null;
  }

  private validateImagePayload(base64Payload: string) {
    const raw = base64Payload.replace(/^data:[^;]+;base64,/, '');
    const sizeBytes = Math.ceil((raw.length * 3) / 4);

    if (sizeBytes > MAX_IMAGE_SIZE_BYTES) {
      throw new BadRequestException(
        `Profile image exceeds ${MAX_IMAGE_SIZE_BYTES / (1024 * 1024)}MB limit (${(sizeBytes / (1024 * 1024)).toFixed(1)}MB detected)`,
      );
    }

    const mimeMatch = base64Payload.match(/^data:([^;]+);base64,/);
    if (mimeMatch && !ALLOWED_IMAGE_MIMES.includes(mimeMatch[1])) {
      throw new BadRequestException(`Unsupported image type "${mimeMatch[1]}". Allowed: ${ALLOWED_IMAGE_MIMES.join(', ')}`);
    }
  }

  async findAllPending(params: {
    page?: number;
    limit?: number;
    schoolId?: string;
    status?: string;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (params.schoolId) where.schoolId = params.schoolId;
    if (params.status) where.status = params.status;
    else where.status = 'PENDING';

    const [data, total] = await Promise.all([
      this.prisma.pendingStudentRequest.findMany({
        where: where as never,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          school: { select: { id: true, name: true } },
          parent: {
            include: {
              user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
            },
          },
        },
      }),
      this.prisma.pendingStudentRequest.count({ where: where as never }),
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
    const request = await this.prisma.pendingStudentRequest.findUnique({
      where: { id },
      include: {
        school: { select: { id: true, name: true } },
        parent: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
          },
        },
      },
    });
    if (!request) throw new NotFoundException('Pending request not found');
    return request;
  }

  async approve(id: string, reviewedById: string, adminNotes?: string) {
    const result = await this.prisma.pendingStudentRequest.updateMany({
      where: { id, status: 'PENDING' },
      data: {
        status: 'APPROVED',
        reviewedById,
        reviewedAt: new Date(),
        adminNotes: adminNotes || null,
      },
    });

    if (result.count === 0) {
      const request = await this.prisma.pendingStudentRequest.findUnique({ where: { id } });
      if (!request) throw new NotFoundException('Pending request not found');
      throw new BadRequestException(`Request is already ${request.status.toLowerCase()}`);
    }

    const request = await this.prisma.pendingStudentRequest.findUnique({
      where: { id },
      include: {
        parent: { include: { user: true } },
      },
    });

    const studentId = `STU-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const qrToken = crypto.randomBytes(32).toString('hex');
    const qrExpiresAt = this.calculateTermEndDate();

    const student = await this.prisma.student.create({
      data: {
        firstName: request!.firstName,
        lastName: request!.lastName,
        dateOfBirth: request!.dateOfBirth,
        grade: request!.grade,
        section: request!.section,
        address: request!.address,
        phone: request!.phone,
        profilePicture: request!.profilePicture,
        schoolId: request!.schoolId,
        studentId,
        qrToken,
        qrExpiresAt,
      },
    });

    await this.prisma.studentParent.create({
      data: {
        studentId: student.id,
        parentId: request!.parentId,
        relation: 'Parent',
        isPrimary: true,
      },
    });

    const parentUser = request!.parent.user;
    const studentName = `${student.firstName} ${student.lastName}`;
    this.notificationGateway.sendToUser(parentUser.id, 'student:approved', {
      studentId: student.id,
      studentName,
      message: `${studentName} has been approved for bus service`,
    });

    await this.prisma.notification.create({
      data: {
        type: 'SYSTEM',
        channel: 'IN_APP',
        title: 'Student Registration Approved',
        body: `${studentName} has been approved for bus service. Scan the QR code at the bus gate to start.`,
        userId: parentUser.id,
        schoolId: request!.schoolId,
        data: { studentId: student.id, qrToken } as never,
        sentAt: new Date(),
      },
    });

    return { student, qrToken, qrExpiresAt };
  }

  async reject(id: string, reviewedById: string, adminNotes?: string) {
    const result = await this.prisma.pendingStudentRequest.updateMany({
      where: { id, status: 'PENDING' },
      data: {
        status: 'REJECTED',
        reviewedById,
        reviewedAt: new Date(),
        adminNotes: adminNotes || null,
      },
    });

    if (result.count === 0) {
      const request = await this.prisma.pendingStudentRequest.findUnique({ where: { id } });
      if (!request) throw new NotFoundException('Pending request not found');
      throw new BadRequestException(`Request is already ${request.status.toLowerCase()}`);
    }

    const request = await this.prisma.pendingStudentRequest.findUnique({
      where: { id },
      include: {
        school: { select: { id: true, name: true } },
        parent: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
        },
      },
    });

    const parentUser = request!.parent.user;
    this.notificationGateway.sendToUser(parentUser.id, 'student:rejected', {
      requestId: id,
      studentName: `${request!.firstName} ${request!.lastName}`,
      reason: adminNotes || 'Registration was not approved',
    });

    await this.prisma.notification.create({
      data: {
        type: 'SYSTEM',
        channel: 'IN_APP',
        title: 'Student Registration Not Approved',
        body: `The registration for ${request!.firstName} ${request!.lastName} was not approved.${adminNotes ? ` Reason: ${adminNotes}` : ''}`,
        userId: parentUser.id,
        schoolId: request!.schoolId,
        data: { requestId: id } as never,
        sentAt: new Date(),
      },
    });

    return request;
  }

  async getMyRequests(parentId: string) {
    return this.prisma.pendingStudentRequest.findMany({
      where: { parentId },
      orderBy: { createdAt: 'desc' },
      include: {
        school: { select: { id: true, name: true } },
      },
    });
  }

  private calculateTermEndDate(): Date {
    const now = new Date();
    const june30ThisYear = new Date(now.getFullYear(), 5, 30, 23, 59, 59);
    if (now <= june30ThisYear) {
      return june30ThisYear;
    }
    return new Date(now.getFullYear() + 1, 5, 30, 23, 59, 59);
  }
}
