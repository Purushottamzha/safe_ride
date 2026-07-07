import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { NotificationGateway } from '../notifications/notification.gateway';
import { NotificationRulesService } from '../notifications/notification-rules.service';
import * as crypto from 'crypto';

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
    return this.prisma.pendingStudentRequest.create({
      data: {
        ...data,
        dateOfBirth: new Date(data.dateOfBirth),
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
    const request = await this.prisma.pendingStudentRequest.findUnique({
      where: { id },
      include: {
        parent: {
          include: { user: true },
        },
      },
    });
    if (!request) throw new NotFoundException('Pending request not found');
    if (request.status !== 'PENDING') {
      throw new BadRequestException(`Request is already ${request.status.toLowerCase()}`);
    }

    const studentId = `STU-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const qrToken = crypto.randomBytes(32).toString('hex');
    const qrExpiresAt = this.calculateTermEndDate();

    const [student] = await this.prisma.$transaction([
      this.prisma.student.create({
        data: {
          firstName: request.firstName,
          lastName: request.lastName,
          dateOfBirth: request.dateOfBirth,
          grade: request.grade,
          section: request.section,
          address: request.address,
          phone: request.phone,
          profilePicture: request.profilePicture,
          schoolId: request.schoolId,
          studentId,
          qrToken,
          qrExpiresAt,
        },
      }),
      this.prisma.pendingStudentRequest.update({
        where: { id },
        data: {
          status: 'APPROVED',
          reviewedById,
          reviewedAt: new Date(),
          adminNotes: adminNotes || null,
        },
      }),
    ]);

    await this.prisma.studentParent.create({
      data: {
        studentId: student.id,
        parentId: request.parentId,
        relation: 'Parent',
        isPrimary: true,
      },
    });

    const parentUser = request.parent.user;
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
        schoolId: request.schoolId,
        data: { studentId: student.id, qrToken } as never,
        sentAt: new Date(),
      },
    });

    return { student, qrToken, qrExpiresAt };
  }

  async reject(id: string, reviewedById: string, adminNotes?: string) {
    const request = await this.prisma.pendingStudentRequest.findUnique({
      where: { id },
      include: {
        parent: { include: { user: true } },
      },
    });
    if (!request) throw new NotFoundException('Pending request not found');
    if (request.status !== 'PENDING') {
      throw new BadRequestException(`Request is already ${request.status.toLowerCase()}`);
    }

    const updated = await this.prisma.pendingStudentRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        reviewedById,
        reviewedAt: new Date(),
        adminNotes: adminNotes || null,
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

    const parentUser = request.parent.user;
    this.notificationGateway.sendToUser(parentUser.id, 'student:rejected', {
      requestId: id,
      studentName: `${request.firstName} ${request.lastName}`,
      reason: adminNotes || 'Registration was not approved',
    });

    await this.prisma.notification.create({
      data: {
        type: 'SYSTEM',
        channel: 'IN_APP',
        title: 'Student Registration Not Approved',
        body: `The registration for ${request.firstName} ${request.lastName} was not approved.${adminNotes ? ` Reason: ${adminNotes}` : ''}`,
        userId: parentUser.id,
        schoolId: request.schoolId,
        data: { requestId: id } as never,
        sentAt: new Date(),
      },
    });

    return updated;
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
    const year = now.getMonth() >= 6 ? now.getFullYear() + 1 : now.getFullYear();
    return new Date(year, 5, 30, 23, 59, 59);
  }
}
