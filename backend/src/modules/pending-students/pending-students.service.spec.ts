import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PendingStudentsService } from './pending-students.service';
import { PrismaService } from '../../database/prisma.service';
import { NotificationGateway } from '../notifications/notification.gateway';
import { NotificationRulesService } from '../notifications/notification-rules.service';

describe('PendingStudentsService', () => {
  let service: PendingStudentsService;
  let prisma: any;
  let notificationGateway: any;
  let notificationRules: any;

  const mockPendingRequest = {
    id: 'pending-1',
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: new Date('2012-05-15'),
    grade: '5',
    section: 'A',
    address: '123 Main St',
    phone: '9841234567',
    profilePicture: null,
    schoolId: 'school-1',
    parentId: 'parent-1',
    status: 'PENDING',
    adminNotes: null,
    reviewedById: null,
    reviewedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    parent: {
      id: 'parent-1',
      user: {
        id: 'user-1',
        firstName: 'Parent',
        lastName: 'User',
        email: 'parent@test.com',
      },
    },
  };

  beforeEach(async () => {
    prisma = {
      pendingStudentRequest: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        updateMany: jest.fn(),
        update: jest.fn(),
      },
      student: { create: jest.fn(), findFirst: jest.fn() },
      studentParent: { create: jest.fn() },
      notification: { create: jest.fn() },
    };

    notificationGateway = {
      sendToUser: jest.fn(),
    };
    notificationRules = {
      evaluateAndNotify: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PendingStudentsService,
        { provide: PrismaService, useValue: prisma },
        { provide: NotificationGateway, useValue: notificationGateway },
        { provide: NotificationRulesService, useValue: notificationRules },
      ],
    }).compile();

    service = module.get<PendingStudentsService>(PendingStudentsService);
  });

  describe('submitRegistration', () => {
    it('should create a pending student request', async () => {
      prisma.pendingStudentRequest.findFirst.mockResolvedValue(null);
      prisma.student.findFirst.mockResolvedValue(null);
      prisma.pendingStudentRequest.create.mockResolvedValue(mockPendingRequest);

      const result = await service.submitRegistration({
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '2012-05-15',
        grade: '5',
        section: 'A',
        address: '123 Main St',
        phone: '9841234567',
        schoolId: 'school-1',
        parentId: 'parent-1',
      });

      expect(result.status).toBe('PENDING');
      expect(prisma.pendingStudentRequest.create).toHaveBeenCalled();
    });

    it('should reject duplicate registration (same name+DOB+school)', async () => {
      prisma.pendingStudentRequest.findFirst.mockResolvedValue(mockPendingRequest);
      prisma.student.findFirst.mockResolvedValue(null);

      await expect(
        service.submitRegistration({
          firstName: 'John', lastName: 'Doe', dateOfBirth: '2012-05-15',
          grade: '5', address: '123', schoolId: 'school-1', parentId: 'parent-1',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject future dateOfBirth', async () => {
      prisma.pendingStudentRequest.findFirst.mockResolvedValue(null);
      prisma.student.findFirst.mockResolvedValue(null);

      await expect(
        service.submitRegistration({
          firstName: 'Future', lastName: 'Child', dateOfBirth: '2099-01-01',
          grade: '1', address: 'xyz', schoolId: 'school-1', parentId: 'parent-1',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject oversized profile image', async () => {
      prisma.pendingStudentRequest.findFirst.mockResolvedValue(null);
      prisma.student.findFirst.mockResolvedValue(null);

      const oversized = 'data:image/jpeg;base64,' + 'A'.repeat(3 * 1024 * 1024);

      await expect(
        service.submitRegistration({
          firstName: 'John', lastName: 'Doe', dateOfBirth: '2012-05-15',
          grade: '5', address: '123', schoolId: 'school-1', parentId: 'parent-1',
          profilePicture: oversized,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('approve (atomic)', () => {
    it('should atomically update status and create student', async () => {
      prisma.pendingStudentRequest.updateMany.mockResolvedValue({ count: 1 });
      prisma.pendingStudentRequest.findUnique.mockResolvedValue(mockPendingRequest);
      prisma.student.create.mockResolvedValue({
        id: 'student-new', firstName: 'John', lastName: 'Doe',
        studentId: 'STU-X', qrToken: 'qr-new', qrExpiresAt: new Date(),
      });
      prisma.studentParent.create.mockResolvedValue({});

      const result = await service.approve('pending-1', 'admin-1');

      expect(result.student).toBeDefined();
      expect(result.qrToken).toBeDefined();
      expect(prisma.pendingStudentRequest.updateMany).toHaveBeenCalledWith({
        where: { id: 'pending-1', status: 'PENDING' },
        data: expect.objectContaining({ status: 'APPROVED' }),
      });
    });

    it('should handle concurrent approve calls (race condition)', async () => {
      // First call succeeds
      prisma.pendingStudentRequest.updateMany.mockResolvedValueOnce({ count: 1 });
      prisma.pendingStudentRequest.findUnique.mockResolvedValue(mockPendingRequest);
      prisma.student.create.mockResolvedValue({
        id: 'student-1', firstName: 'John', lastName: 'Doe',
        studentId: 'STU-1', qrToken: 'qr-1', qrExpiresAt: new Date(),
      });
      prisma.studentParent.create.mockResolvedValue({});

      const result1 = await service.approve('pending-1', 'admin-1');
      expect(result1.student).toBeDefined();

      // Second concurrent call — updateMany affects 0 rows because status is no longer PENDING
      prisma.pendingStudentRequest.updateMany.mockResolvedValueOnce({ count: 0 });
      prisma.pendingStudentRequest.findUnique.mockResolvedValue({
        ...mockPendingRequest, status: 'APPROVED',
      });

      await expect(service.approve('pending-1', 'admin-2')).rejects.toThrow(BadRequestException);
    });

    it('should throw if request not found', async () => {
      prisma.pendingStudentRequest.updateMany.mockResolvedValue({ count: 0 });
      prisma.pendingStudentRequest.findUnique.mockResolvedValue(null);

      await expect(service.approve('invalid', 'admin-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw if already approved', async () => {
      prisma.pendingStudentRequest.updateMany.mockResolvedValue({ count: 0 });
      prisma.pendingStudentRequest.findUnique.mockResolvedValue({
        ...mockPendingRequest, status: 'APPROVED',
      });

      await expect(service.approve('pending-1', 'admin-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('reject (atomic)', () => {
    it('should atomically reject', async () => {
      prisma.pendingStudentRequest.updateMany.mockResolvedValue({ count: 1 });
      prisma.pendingStudentRequest.findUnique.mockResolvedValue({
        ...mockPendingRequest, status: 'REJECTED',
      });

      const result = await service.reject('pending-1', 'admin-1', 'Not eligible');
      expect(result.status).toBe('REJECTED');
      expect(prisma.pendingStudentRequest.updateMany).toHaveBeenCalledWith({
        where: { id: 'pending-1', status: 'PENDING' },
        data: expect.objectContaining({ status: 'REJECTED' }),
      });
    });

    it('should handle concurrent reject calls', async () => {
      prisma.pendingStudentRequest.updateMany.mockResolvedValueOnce({ count: 1 });
      prisma.pendingStudentRequest.findUnique.mockResolvedValue({ ...mockPendingRequest, status: 'REJECTED' });

      const result = await service.reject('pending-1', 'admin-1');
      expect(result.status).toBe('REJECTED');

      prisma.pendingStudentRequest.updateMany.mockResolvedValueOnce({ count: 0 });
      prisma.pendingStudentRequest.findUnique.mockResolvedValue({ ...mockPendingRequest, status: 'REJECTED' });

      await expect(service.reject('pending-1', 'admin-2')).rejects.toThrow(BadRequestException);
    });
  });

  describe('calculateTermEndDate', () => {
    it('should return June 30 of current year when before July 1', () => {
      const jan5 = new Date(2026, 0, 5);
      jest.useFakeTimers().setSystemTime(jan5);
      const service2 = new PendingStudentsService(prisma, notificationGateway, notificationRules);
      const result = (service2 as any).calculateTermEndDate();
      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(5);
      expect(result.getDate()).toBe(30);
      jest.useRealTimers();
    });

    it('should return June 30 of next year when on/after July 1', () => {
      const july5 = new Date(2026, 6, 5);
      jest.useFakeTimers().setSystemTime(july5);
      const service2 = new PendingStudentsService(prisma, notificationGateway, notificationRules);
      const result = (service2 as any).calculateTermEndDate();
      expect(result.getFullYear()).toBe(2027);
      expect(result.getMonth()).toBe(5);
      expect(result.getDate()).toBe(30);
      jest.useRealTimers();
    });

    it('should return June 30 of same day when approved on June 30 itself', () => {
      const june30 = new Date(2026, 5, 30, 12, 0, 0);
      jest.useFakeTimers().setSystemTime(june30);
      const service2 = new PendingStudentsService(prisma, notificationGateway, notificationRules);
      const result = (service2 as any).calculateTermEndDate();
      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(5);
      expect(result.getDate()).toBe(30);
      expect(result.getTime()).toBeGreaterThan(june30.getTime());
      jest.useRealTimers();
    });
  });
});
