import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { QRService } from './qr.service';
import { PrismaService } from '../../database/prisma.service';
import { NotificationGateway } from '../notifications/notification.gateway';
import { ScanType, TripStatus, TripType } from '@prisma/client';

describe('QRService', () => {
  let service: QRService;
  let prisma: any;
  let notificationGateway: any;

  const mockStudent = {
    id: 'student-1',
    firstName: 'Ram',
    lastName: 'Sharma',
    studentId: 'STU-001',
    grade: '5',
    section: 'A',
    qrToken: 'valid-qr-token',
    qrExpiresAt: new Date(Date.now() + 86400000),
    isActive: true,
    deletedAt: null,
    profilePicture: null,
  };

  const mockTrip = {
    id: 'trip-1',
    type: TripType.MORNING,
    status: TripStatus.ACTIVE,
    scheduledAt: new Date('2026-01-15T07:00:00Z'),
    schoolId: 'school-1',
    assignment: {
      studentAssignments: [{ studentId: 'student-1', isActive: true }],
    },
  };

  beforeEach(async () => {
    prisma = {
      student: { findFirst: jest.fn() },
      trip: { findFirst: jest.fn() },
      tripEvent: { findFirst: jest.fn(), create: jest.fn() },
      attendance: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        upsert: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
      },
      studentParent: { findMany: jest.fn() },
      notification: { create: jest.fn() },
    };

    notificationGateway = {
      sendToUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QRService,
        { provide: PrismaService, useValue: prisma },
        { provide: NotificationGateway, useValue: notificationGateway },
      ],
    }).compile();

    service = module.get<QRService>(QRService);
  });

  describe('scanQR', () => {
    it('should create TripEvent and update Attendance on BOARD_IN', async () => {
      prisma.student.findFirst.mockResolvedValue(mockStudent);
      prisma.trip.findFirst.mockResolvedValue(mockTrip);
      prisma.tripEvent.findFirst.mockResolvedValue(null);
      prisma.tripEvent.create.mockResolvedValue({
        id: 'event-1',
        tripId: 'trip-1',
        studentId: 'student-1',
        scanType: ScanType.BOARD_IN,
      });
      prisma.attendance.upsert.mockResolvedValue({});
      prisma.studentParent.findMany.mockResolvedValue([]);

      const result = await service.scanQR({
        studentId: 'student-1',
        tripId: 'trip-1',
        scanType: ScanType.BOARD_IN,
      });

      expect(result.event.scanType).toBe(ScanType.BOARD_IN);
      expect(result.message).toContain('boarded');
      expect(prisma.attendance.upsert).toHaveBeenCalled();
    });

    it('should update Attendance on EXIT_OUT', async () => {
      prisma.student.findFirst.mockResolvedValue(mockStudent);
      prisma.trip.findFirst.mockResolvedValue(mockTrip);
      prisma.tripEvent.findFirst.mockResolvedValue(null);
      prisma.tripEvent.create.mockResolvedValue({
        id: 'event-2',
        tripId: 'trip-1',
        studentId: 'student-1',
        scanType: ScanType.EXIT_OUT,
      });
      prisma.attendance.findUnique.mockResolvedValue({
        id: 'att-1',
        boardTime: new Date('2026-01-15T07:00:00Z'),
        status: 'PRESENT',
      });
      prisma.attendance.update.mockResolvedValue({});
      prisma.studentParent.findMany.mockResolvedValue([]);

      const result = await service.scanQR({
        studentId: 'student-1',
        tripId: 'trip-1',
        scanType: ScanType.EXIT_OUT,
      });

      expect(result.event.scanType).toBe(ScanType.EXIT_OUT);
      expect(result.message).toContain('exited');
    });

    it('should throw NotFoundException for invalid token', async () => {
      prisma.student.findFirst.mockResolvedValue(null);

      await expect(
        service.scanQR({
          studentId: 'invalid',
          tripId: 'trip-1',
          scanType: ScanType.BOARD_IN,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for expired token', async () => {
      prisma.student.findFirst.mockResolvedValue({
        ...mockStudent,
        qrExpiresAt: new Date(Date.now() - 86400000),
      });

      await expect(
        service.scanQR({
          studentId: 'student-1',
          tripId: 'trip-1',
          scanType: ScanType.BOARD_IN,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException on inactive trip', async () => {
      prisma.student.findFirst.mockResolvedValue(mockStudent);
      prisma.trip.findFirst.mockResolvedValue({
        ...mockTrip,
        status: TripStatus.SCHEDULED,
      });

      await expect(
        service.scanQR({
          studentId: 'student-1',
          tripId: 'trip-1',
          scanType: ScanType.BOARD_IN,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
