import { Test, TestingModule } from '@nestjs/testing';
import { HardwareController } from './hardware.controller';
import { HardwareService } from './hardware.service';
import { QRService } from '../qr/qr.service';
import { PrismaService } from '../../database/prisma.service';
import { NotificationGateway } from '../notifications/notification.gateway';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('HardwareController', () => {
  let controller: HardwareController;
  let hardwareService: any;
  let qrService: any;
  let prisma: any;
  let notificationGateway: any;

  const mockStudent = {
    id: 'student-1',
    firstName: 'Ram',
    lastName: 'Sharma',
    studentId: 'STU-001',
    grade: '5',
    section: 'A',
    profilePicture: null,
  };

  const mockTrip = {
    id: 'trip-1',
    type: 'MORNING',
    status: 'DRIVING_TO_PICKUP',
  };

  beforeEach(async () => {
    hardwareService = {
      findActiveTripForBus: jest.fn(),
      getTripById: jest.fn(),
      determineScanType: jest.fn(),
    };

    qrService = {
      validateQRToken: jest.fn(),
      scanQR: jest.fn(),
    };

    prisma = {};
    notificationGateway = {};

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HardwareController],
      providers: [
        { provide: HardwareService, useValue: hardwareService },
        { provide: QRService, useValue: qrService },
        { provide: PrismaService, useValue: prisma },
        { provide: NotificationGateway, useValue: notificationGateway },
      ],
    }).compile();

    controller = module.get<HardwareController>(HardwareController);
  });

  describe('POST /hardware/qr-scan', () => {
    const validDto = {
      deviceId: 'webcam-demo-001',
      busId: 'bus-1',
      qrToken: 'valid-qr-token',
      capturedAt: '2026-07-07T08:30:00Z',
    };

    it('should scan QR via busId (lookup active trip) and return student info', async () => {
      qrService.validateQRToken.mockResolvedValue({ valid: true, student: mockStudent });
      hardwareService.findActiveTripForBus.mockResolvedValue(mockTrip);
      hardwareService.getTripById.mockResolvedValue(mockTrip);
      hardwareService.determineScanType.mockReturnValue('BOARD_IN');
      qrService.scanQR.mockResolvedValue({
        event: { id: 'event-1', scanType: 'BOARD_IN' },
        message: 'Student boarded successfully',
      });

      const result = await controller.scanQR(validDto);

      expect(result.success).toBe(true);
      expect(result.scanType).toBe('BOARD_IN');
      expect(result.student.firstName).toBe('Ram');
      expect(hardwareService.findActiveTripForBus).toHaveBeenCalledWith('bus-1');
      expect(qrService.scanQR).toHaveBeenCalledWith({
        studentId: 'student-1',
        tripId: 'trip-1',
        scanType: 'BOARD_IN',
        latitude: undefined,
        longitude: undefined,
      });
    });

    it('should use tripId directly when provided (no bus lookup)', async () => {
      const dtoWithTrip = { ...validDto, tripId: 'trip-direct', busId: undefined };
      qrService.validateQRToken.mockResolvedValue({ valid: true, student: mockStudent });
      hardwareService.getTripById.mockResolvedValue({ ...mockTrip, id: 'trip-direct' });
      hardwareService.determineScanType.mockReturnValue('EXIT_OUT');
      qrService.scanQR.mockResolvedValue({
        event: { id: 'event-2', scanType: 'EXIT_OUT' },
        message: 'Student exited successfully',
      });

      const result = await controller.scanQR(dtoWithTrip);

      expect(result.success).toBe(true);
      expect(result.scanType).toBe('EXIT_OUT');
      expect(hardwareService.findActiveTripForBus).not.toHaveBeenCalled();
      expect(qrService.scanQR).toHaveBeenCalledWith({
        studentId: 'student-1',
        tripId: 'trip-direct',
        scanType: 'EXIT_OUT',
        latitude: undefined,
        longitude: undefined,
      });
    });

    it('should throw if neither tripId nor busId is provided', async () => {
      const invalidDto = { deviceId: 'demo-1', qrToken: 'token' };
      qrService.validateQRToken.mockResolvedValue({ valid: true, student: mockStudent });

      await expect(controller.scanQR(invalidDto as any)).rejects.toThrow(BadRequestException);
    });

    it('should throw if QR token is invalid', async () => {
      qrService.validateQRToken.mockRejectedValue(new NotFoundException('Invalid QR token'));

      await expect(controller.scanQR(validDto)).rejects.toThrow(NotFoundException);
    });
  });
});
