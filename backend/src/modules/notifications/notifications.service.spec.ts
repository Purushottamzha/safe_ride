import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../../database/prisma.service';
import { NotificationGateway } from './notification.gateway';
import { NotificationType, NotificationChannel } from '@prisma/client';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: any;
  let notificationGateway: any;

  const mockNotification = {
    id: 'notif-1',
    type: NotificationType.ATTENDANCE,
    channel: NotificationChannel.WEBSOCKET,
    title: 'Student Boarded Bus',
    body: 'Ram Sharma has boarded the morning trip.',
    data: null,
    userId: 'user-1',
    schoolId: 'school-1',
    isRead: false,
    readAt: null,
    sentAt: new Date(),
    createdAt: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      notification: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        count: jest.fn(),
        delete: jest.fn(),
      },
    };

    notificationGateway = {
      sendToUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: prisma },
        { provide: NotificationGateway, useValue: notificationGateway },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  describe('create', () => {
    it('should create a notification', async () => {
      prisma.notification.create.mockResolvedValue(mockNotification);

      const result = await service.create({
        type: NotificationType.ATTENDANCE,
        channel: NotificationChannel.WEBSOCKET,
        title: 'Student Boarded Bus',
        body: 'Ram Sharma has boarded the morning trip.',
        userId: 'user-1',
        schoolId: 'school-1',
      });

      expect(result.id).toBe('notif-1');
      expect(result.title).toBe('Student Boarded Bus');
      expect(prisma.notification.create).toHaveBeenCalled();
    });

    it('should send WebSocket notification if userId provided', async () => {
      prisma.notification.create.mockResolvedValue(mockNotification);

      await service.create({
        type: NotificationType.ATTENDANCE,
        channel: NotificationChannel.WEBSOCKET,
        title: 'Test',
        body: 'Test body',
        userId: 'user-1',
      });

      expect(notificationGateway.sendToUser).toHaveBeenCalledWith(
        'user-1',
        'notification:new',
        expect.any(Object),
      );
    });
  });

  describe('markAsRead', () => {
    it('should update isRead to true', async () => {
      prisma.notification.findUnique.mockResolvedValue(mockNotification);
      prisma.notification.update.mockResolvedValue({
        ...mockNotification,
        isRead: true,
        readAt: new Date(),
      });

      const result = await service.markAsRead('notif-1');

      expect(result.isRead).toBe(true);
      expect(result.readAt).toBeDefined();
    });

    it('should throw NotFoundException for non-existent notification', async () => {
      prisma.notification.findUnique.mockResolvedValue(null);

      await expect(service.markAsRead('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});
