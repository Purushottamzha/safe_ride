import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../../database/prisma.service';
import { UserRole, UserStatus } from '@prisma/client';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: any;

  const mockUser = {
    id: 'user-1',
    email: 'test@saferide.com',
    phone: '+977-9841234567',
    firstName: 'Test',
    lastName: 'User',
    role: UserRole.SCHOOL_ADMIN,
    status: UserStatus.ACTIVE,
    isEmailVerified: true,
    lastLoginAt: new Date(),
    schoolId: 'school-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      const users = [mockUser];
      prisma.user.findMany.mockResolvedValue(users);
      prisma.user.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toEqual(users);
      expect(result.meta.total).toBe(1);
    });

    it('should filter by search', async () => {
      prisma.user.findMany.mockResolvedValue([mockUser]);
      prisma.user.count.mockResolvedValue(1);

      await service.findAll({ search: 'Test' });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ firstName: { contains: 'Test', mode: 'insensitive' } }),
            ]),
          }),
        }),
      );
    });
  });

  describe('update', () => {
    it('should change user data', async () => {
      prisma.user.findFirst.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue({
        ...mockUser,
        firstName: 'Updated',
        phone: '+977-9800000000',
      });

      const result = await service.update('user-1', {
        firstName: 'Updated',
        phone: '+977-9800000000',
      });

      expect(result.firstName).toBe('Updated');
      expect(result.phone).toBe('+977-9800000000');
    });
  });
});
