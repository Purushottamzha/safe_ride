import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PendingStudentsService } from './pending-students.service';
import { PrismaService } from '../../database/prisma.service';
import { NotificationGateway } from '../notifications/notification.gateway';

describe('PendingStudentsService', () => {
  let service: PendingStudentsService;
  let prisma: any;
  let notificationGateway: any;

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
        findMany: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
      },
      student: { create: jest.fn() },
      studentParent: { create: jest.fn() },
      notification: { create: jest.fn() },
    };

    notificationGateway = {
      sendToUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PendingStudentsService,
        { provide: PrismaService, useValue: prisma },
        { provide: NotificationGateway, useValue: notificationGateway },
      ],
    }).compile();

    service = module.get<PendingStudentsService>(PendingStudentsService);
  });

  describe('submitRegistration', () => {
    it('should create a pending student request', async () => {
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
  });

  describe('approve', () => {
    it('should create a Student record and generate QR token on approval', async () => {
      prisma.pendingStudentRequest.findUnique.mockResolvedValue(mockPendingRequest);
      prisma.student.create.mockResolvedValue({
        id: 'student-new',
        firstName: 'John',
        lastName: 'Doe',
        grade: '5',
        section: 'A',
        studentId: 'STU-TEST-001',
        qrToken: 'new-qr-token',
        qrExpiresAt: new Date(),
      });
      prisma.pendingStudentRequest.update.mockResolvedValue({
        ...mockPendingRequest,
        status: 'APPROVED',
      });
      prisma.studentParent.create.mockResolvedValue({});

      const result = await service.approve('pending-1', 'admin-1', 'Approved');

      expect(result.student).toBeDefined();
      expect(result.qrToken).toBeDefined();
      expect(prisma.student.create).toHaveBeenCalled();
      expect(prisma.studentParent.create).toHaveBeenCalled();
      expect(notificationGateway.sendToUser).toHaveBeenCalledWith('user-1', 'student:approved', expect.any(Object));
    });

    it('should throw if request not found', async () => {
      prisma.pendingStudentRequest.findUnique.mockResolvedValue(null);

      await expect(service.approve('invalid', 'admin-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw if already approved', async () => {
      prisma.pendingStudentRequest.findUnique.mockResolvedValue({
        ...mockPendingRequest,
        status: 'APPROVED',
      });

      await expect(service.approve('pending-1', 'admin-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('reject', () => {
    it('should reject a pending request and notify parent', async () => {
      prisma.pendingStudentRequest.findUnique.mockResolvedValue(mockPendingRequest);
      prisma.pendingStudentRequest.update.mockResolvedValue({
        ...mockPendingRequest,
        status: 'REJECTED',
        adminNotes: 'Duplicate entry',
      });

      const result = await service.reject('pending-1', 'admin-1', 'Duplicate entry');

      expect(result.status).toBe('REJECTED');
      expect(notificationGateway.sendToUser).toHaveBeenCalledWith('user-1', 'student:rejected', expect.any(Object));
    });

    it('should throw if already rejected', async () => {
      prisma.pendingStudentRequest.findUnique.mockResolvedValue({
        ...mockPendingRequest,
        status: 'REJECTED',
      });

      await expect(service.reject('pending-1', 'admin-1')).rejects.toThrow(BadRequestException);
    });
  });
});
