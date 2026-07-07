import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { TripsService } from './trips.service';
import { PrismaService } from '../../database/prisma.service';
import { NotificationGateway } from '../notifications/notification.gateway';
import { IncidentsService } from '../incidents/incidents.service';
import { TripStatus, TripType } from '@prisma/client';

describe('TripsService', () => {
  let service: TripsService;
  let prisma: any;
  let notificationGateway: any;

  const mockTrip = {
    id: 'trip-1',
    type: TripType.MORNING,
    status: TripStatus.SCHEDULED,
    scheduledAt: new Date('2026-01-15T07:00:00Z'),
    startedAt: null,
    completedAt: null,
    cancelledAt: null,
    cancelReason: null,
    notes: null,
    driverId: 'driver-1',
    busId: 'bus-1',
    routeId: 'route-1',
    assignmentId: 'assign-1',
    schoolId: 'school-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    driver: { id: 'driver-1', firstName: 'Driver', lastName: 'One', email: 'driver@test.com' },
    bus: { id: 'bus-1', plateNumber: 'BA 1 CH 1234', busNumber: 'B1' },
    route: { id: 'route-1', name: 'Route 1', code: 'R1' },
    school: { id: 'school-1', name: 'Test School' },
    _count: { tripEvents: 0, attendance: 0 },
  };

  beforeEach(async () => {
    prisma = {
      trip: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      user: { findFirst: jest.fn() },
      notification: { create: jest.fn() },
    };

    notificationGateway = {
      sendToUser: jest.fn(),
      sendToSchool: jest.fn(),
    };

    const mockIncidentsService = {
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TripsService,
        { provide: PrismaService, useValue: prisma },
        { provide: NotificationGateway, useValue: notificationGateway },
        { provide: IncidentsService, useValue: mockIncidentsService },
      ],
    }).compile();

    service = module.get<TripsService>(TripsService);
  });

  describe('startTrip', () => {
    it('should change status to ACTIVE', async () => {
      prisma.trip.findFirst.mockResolvedValue(mockTrip);
      prisma.trip.update.mockResolvedValue({
        ...mockTrip,
        status: TripStatus.ACTIVE,
        startedAt: new Date(),
      });
      prisma.notification.create.mockResolvedValue({});

      const result = await service.startTrip('trip-1');

      expect(result.status).toBe(TripStatus.ACTIVE);
      expect(result.startedAt).toBeDefined();
    });

    it('should throw error on already active trip', async () => {
      prisma.trip.findFirst.mockResolvedValue({
        ...mockTrip,
        status: TripStatus.ACTIVE,
      });

      await expect(service.startTrip('trip-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw error with no driver assigned', async () => {
      prisma.trip.findFirst.mockResolvedValue({
        ...mockTrip,
        driverId: null,
      });

      await expect(service.startTrip('trip-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw error with no bus assigned', async () => {
      prisma.trip.findFirst.mockResolvedValue({
        ...mockTrip,
        busId: null,
      });

      await expect(service.startTrip('trip-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('completeTrip', () => {
    it('should change status to COMPLETED', async () => {
      prisma.trip.findFirst.mockResolvedValue({
        ...mockTrip,
        status: TripStatus.ACTIVE,
        startedAt: new Date(),
      });
      prisma.attendance = {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      };
      prisma.trip.update.mockResolvedValue({
        ...mockTrip,
        status: TripStatus.COMPLETED,
        completedAt: new Date(),
        _count: { tripEvents: 5, attendance: 20 },
      });
      prisma.notification.create.mockResolvedValue({});

      const result = await service.completeTrip('trip-1');

      expect(result.status).toBe(TripStatus.COMPLETED);
      expect(result.completedAt).toBeDefined();
    });

    it('should block completion if students are unaccounted for', async () => {
      prisma.trip.findFirst.mockResolvedValue({
        ...mockTrip,
        status: TripStatus.DROPPING,
        startedAt: new Date(),
      });
      prisma.attendance = {
        findMany: jest.fn().mockResolvedValue([
          {
            student: { id: 's1', firstName: 'Ram', lastName: 'Sharma' },
          },
          {
            student: { id: 's2', firstName: 'Sita', lastName: 'Doe' },
          },
        ]),
        count: jest.fn(),
      };

      await expect(service.completeTrip('trip-1')).rejects.toThrow(BadRequestException);
    });

    it('should create Incident and complete when force=true with unaccounted students', async () => {
      const incidentsService = module.get<IncidentsService>(IncidentsService);
      jest.spyOn(incidentsService, 'create').mockResolvedValue({} as any);

      prisma.trip.findFirst.mockResolvedValue({
        ...mockTrip,
        status: TripStatus.DROPPING,
        startedAt: new Date(),
      });
      prisma.attendance = {
        findMany: jest.fn().mockResolvedValue([
          {
            student: { id: 's1', firstName: 'Ram', lastName: 'Sharma' },
          },
        ]),
        count: jest.fn().mockResolvedValue(0),
      };
      prisma.trip.update.mockResolvedValue({
        ...mockTrip,
        status: TripStatus.COMPLETED,
        completedAt: new Date(),
      });
      prisma.notification.create.mockResolvedValue({});

      const result = await service.completeTrip('trip-1', {
        force: true,
        unresolvedReason: 'Forced completion',
        userId: 'admin-1',
      });

      expect(result.status).toBe(TripStatus.COMPLETED);
      expect(incidentsService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Students not confirmed exited',
          severity: 'MEDIUM',
          tripId: 'trip-1',
        }),
      );
    });

    it('should derive dropCount from exitTime IS NOT NULL', async () => {
      prisma.trip.findFirst.mockResolvedValue({
        ...mockTrip,
        status: TripStatus.DROPPING,
        startedAt: new Date(),
      });
      prisma.attendance = {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(5),
      };
      prisma.trip.update.mockResolvedValue({
        ...mockTrip,
        status: TripStatus.COMPLETED,
        completedAt: new Date(),
        dropCount: 5,
      });
      prisma.notification.create.mockResolvedValue({});

      const result = await service.completeTrip('trip-1');

      expect(result.dropCount).toBe(5);
      expect(prisma.attendance.count).toHaveBeenCalledWith({
        where: { tripId: 'trip-1', exitTime: { not: null } },
      });
    });
  });

  describe('cancelTrip', () => {
    it('should change status to CANCELLED', async () => {
      prisma.trip.findFirst.mockResolvedValue(mockTrip);
      prisma.trip.update.mockResolvedValue({
        ...mockTrip,
        status: TripStatus.CANCELLED,
        cancelledAt: new Date(),
        cancelReason: 'Weather conditions',
      });
      prisma.notification.create.mockResolvedValue({});

      const result = await service.cancelTrip('trip-1', 'Weather conditions');

      expect(result.status).toBe(TripStatus.CANCELLED);
      expect(result.cancelReason).toBe('Weather conditions');
    });
  });
});
