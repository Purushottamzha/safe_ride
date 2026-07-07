import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { NotificationGateway } from '../notifications/notification.gateway';
import { Prisma, ScanType } from '@prisma/client';

@Injectable()
export class QRService {
  constructor(
    private prisma: PrismaService,
    private notificationGateway: NotificationGateway,
  ) {}

  async validateQRToken(token: string) {
    const student = await this.prisma.student.findFirst({
      where: { qrToken: token, deletedAt: null, isActive: true },
    });
    if (!student) throw new NotFoundException('Invalid QR token');
    if (student.qrExpiresAt < new Date()) {
      throw new BadRequestException('QR code has expired');
    }
    return {
      valid: true,
      student: {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        studentId: student.studentId,
        grade: student.grade,
        section: student.section,
        profilePicture: student.profilePicture,
      },
    };
  }

  async scanQR(data: {
    studentId: string;
    tripId: string;
    scanType: ScanType;
    latitude?: number;
    longitude?: number;
  }) {
    const student = await this.prisma.student.findFirst({
      where: { id: data.studentId, deletedAt: null, isActive: true },
    });
    if (!student) throw new NotFoundException('Student not found');
    if (student.qrExpiresAt < new Date()) {
      throw new BadRequestException('QR code has expired. Please request a new one.');
    }

    const trip = await this.prisma.trip.findFirst({
      where: { id: data.tripId, deletedAt: null },
      include: {
        assignment: {
          include: {
            studentAssignments: { where: { isActive: true } },
          },
        },
      },
    });
    if (!trip) throw new NotFoundException('Trip not found');
    if (trip.status !== 'ACTIVE') throw new BadRequestException('Trip is not currently active');

    if (trip.assignment?.studentAssignments && trip.assignment.studentAssignments.length > 0) {
      const isAssigned = trip.assignment.studentAssignments.some(
        (sa) => sa.studentId === data.studentId,
      );
      if (!isAssigned) {
        throw new BadRequestException('Student is not assigned to this trip route');
      }
    }

    const duplicate = await this.prisma.tripEvent.findFirst({
      where: {
        tripId: data.tripId,
        studentId: data.studentId,
        scanType: data.scanType,
      },
    });
    if (duplicate) {
      throw new ConflictException(
        `Student has already been scanned as ${data.scanType === 'BOARD_IN' ? 'boarded' : 'exited'} for this trip`,
      );
    }

    const tripEvent = await this.prisma.tripEvent.create({
      data: {
        tripId: data.tripId,
        studentId: data.studentId,
        scanType: data.scanType,
        latitude: data.latitude,
        longitude: data.longitude,
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentId: true,
            grade: true,
            section: true,
          },
        },
        trip: {
          select: { id: true, type: true, status: true, scheduledAt: true },
        },
      },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (data.scanType === 'BOARD_IN') {
      await this.prisma.attendance.upsert({
        where: {
          studentId_schoolId_date_type: {
            studentId: data.studentId,
            schoolId: trip.schoolId,
            date: today,
            type: trip.type,
          },
        },
        update: {
          boardTime: new Date(),
          boardEventId: tripEvent.id,
          status: 'PRESENT',
          tripId: data.tripId,
        },
        create: {
          studentId: data.studentId,
          tripId: data.tripId,
          schoolId: trip.schoolId,
          date: today,
          type: trip.type,
          boardTime: new Date(),
          boardEventId: tripEvent.id,
          status: 'PRESENT',
        },
      });
    } else if (data.scanType === 'EXIT_OUT') {
      const attendance = await this.prisma.attendance.findUnique({
        where: {
          studentId_schoolId_date_type: {
            studentId: data.studentId,
            schoolId: trip.schoolId,
            date: today,
            type: trip.type,
          },
        },
      });

      if (attendance) {
        let isLate = false;
        let lateMinutes = 0;
        if (attendance.boardTime) {
          const scheduledMin = trip.scheduledAt.getHours() * 60 + trip.scheduledAt.getMinutes();
          const boardMin = attendance.boardTime.getHours() * 60 + attendance.boardTime.getMinutes();
          if (boardMin > scheduledMin + 5) {
            isLate = true;
            lateMinutes = boardMin - scheduledMin;
          }
        }

        const finalStatus: 'PRESENT' | 'LATE' = isLate ? 'LATE' : 'PRESENT';

        await this.prisma.attendance.update({
          where: { id: attendance.id },
          data: {
            exitTime: new Date(),
            exitEventId: tripEvent.id,
            isLate,
            lateMinutes,
            status: finalStatus,
            tripId: data.tripId,
          },
        });
      } else {
        await this.prisma.attendance.create({
          data: {
            studentId: data.studentId,
            tripId: data.tripId,
            schoolId: trip.schoolId,
            date: today,
            type: trip.type,
            exitTime: new Date(),
            exitEventId: tripEvent.id,
            status: 'PRESENT',
          },
        });
      }
    }

    const parentRelations = await this.prisma.studentParent.findMany({
      where: { studentId: data.studentId },
      include: {
        parent: { select: { id: true, userId: true } },
        student: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    const scanLabel = data.scanType === 'BOARD_IN' ? 'boarded' : 'exited';
    const tripLabel = trip.type === 'MORNING' ? 'morning' : 'afternoon';
    const notificationTitle =
      data.scanType === 'BOARD_IN' ? 'Student Boarded Bus' : 'Student Exited Bus';
    const notificationBody = `${student.firstName} ${student.lastName} has ${scanLabel} the ${tripLabel} trip.`;

    const notificationPayload = {
      eventId: tripEvent.id,
      studentId: data.studentId,
      studentName: `${student.firstName} ${student.lastName}`,
      tripId: data.tripId,
      tripType: trip.type,
      scanType: data.scanType,
      timestamp: new Date().toISOString(),
    };

    for (const rel of parentRelations) {
      this.notificationGateway.sendToUser(
        rel.parent.userId,
        'attendance:update',
        notificationPayload,
      );

      await this.prisma.notification.create({
        data: {
          type: 'ATTENDANCE',
          channel: 'WEBSOCKET',
          title: notificationTitle,
          body: notificationBody,
          userId: rel.parent.userId,
          schoolId: trip.schoolId,
          data: notificationPayload,
          sentAt: new Date(),
        },
      });
    }

    return {
      event: tripEvent,
      message: `Student ${scanLabel} successfully`,
    };
  }

  async getStudentAttendance(studentId: string, fromDate?: Date, toDate?: Date) {
    const where: Prisma.AttendanceWhereInput = { studentId };

    if (fromDate || toDate) {
      where.date = {};
      if (fromDate) where.date.gte = fromDate;
      if (toDate) where.date.lte = toDate;
    }

    return this.prisma.attendance.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        trip: { select: { id: true, type: true, status: true, scheduledAt: true } },
        school: { select: { id: true, name: true } },
      },
    });
  }
}
