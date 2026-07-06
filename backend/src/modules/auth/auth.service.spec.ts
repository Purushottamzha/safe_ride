import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../database/redis.service';
import { UserRole } from '@prisma/client';
import * as argon2 from 'argon2';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: any;
  let jwtService: any;
  let configService: any;
  let redis: any;

  const mockUser = {
    id: 'user-1',
    email: 'test@saferide.com',
    firstName: 'Test',
    lastName: 'User',
    role: UserRole.SCHOOL_ADMIN,
    schoolId: 'school-1',
    passwordHash: 'hashed-password',
    status: 'ACTIVE',
    loginAttempts: 0,
    lockoutUntil: null,
    refreshToken: null,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      student: { findMany: jest.fn(), count: jest.fn() },
      attendance: { findMany: jest.fn(), count: jest.fn() },
      trip: { findMany: jest.fn(), count: jest.fn() },
      driver: { findMany: jest.fn(), count: jest.fn() },
      bus: { findMany: jest.fn(), count: jest.fn() },
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('mock-token'),
      verify: jest.fn().mockReturnValue({ sub: 'user-1', email: 'test@saferide.com', role: 'SCHOOL_ADMIN' }),
    };

    configService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'jwt.refreshSecret') return 'refresh-secret';
        if (key === 'jwt.refreshExpiration') return '7d';
        if (key === 'jwt.secret') return 'jwt-secret';
        return null;
      }),
    };

    redis = {
      set: jest.fn().mockResolvedValue('OK'),
      del: jest.fn().mockResolvedValue(1),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
        { provide: RedisService, useValue: redis },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('should create user with hashed password', async () => {
      const dto = {
        email: 'new@saferide.com',
        password: 'SecurePass123!',
        firstName: 'New',
        lastName: 'User',
        role: UserRole.SCHOOL_ADMIN,
        schoolId: 'school-1',
      };

      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        ...mockUser,
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
      });

      const result = await service.register(dto);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: dto.email } });
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: dto.email,
          firstName: dto.firstName,
          passwordHash: expect.any(String),
        }),
      });

      const createCall = prisma.user.create.mock.calls[0][0];
      expect(createCall.data.passwordHash).not.toBe(dto.password);

      expect(result.user.email).toBe(dto.email);
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.refreshToken).toBeDefined();
    });

    it('should throw ConflictException for duplicate email', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.register({
          email: 'test@saferide.com',
          password: 'SecurePass123!',
          firstName: 'Test',
          lastName: 'User',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should return tokens for valid credentials', async () => {
      const passwordHash = await argon2.hash('SecurePass123!');
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, passwordHash });
      prisma.user.update.mockResolvedValue({ ...mockUser, lastLoginAt: new Date() });

      const result = await service.login({
        email: 'test@saferide.com',
        password: 'SecurePass123!',
      });

      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.refreshToken).toBeDefined();
      expect(result.user.email).toBe('test@saferide.com');
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      const passwordHash = await argon2.hash('CorrectPass123!');
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, passwordHash });
      prisma.user.update.mockResolvedValue(mockUser);

      await expect(
        service.login({ email: 'test@saferide.com', password: 'WrongPass123!' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for locked account', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        status: 'LOCKED',
      });

      await expect(
        service.login({ email: 'test@saferide.com', password: 'SecurePass123!' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshToken', () => {
    it('should return new tokens for valid refresh token', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        refreshToken: 'valid-refresh-token',
      });

      const result = await service.refreshToken({ refreshToken: 'valid-refresh-token' });

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.refreshToken({ refreshToken: 'invalid-token' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should clear refresh token and session', async () => {
      prisma.user.update.mockResolvedValue(mockUser);

      await service.logout('user-1');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { refreshToken: null },
      });
      expect(redis.del).toHaveBeenCalledWith('session:user-1');
    });
  });

  describe('getProfile', () => {
    it('should return user data', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@saferide.com',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.SCHOOL_ADMIN,
        schoolId: 'school-1',
        school: { id: 'school-1', name: 'Test School', code: 'TS' },
        createdAt: new Date(),
      });

      const result = await service.getProfile('user-1');

      expect(result.id).toBe('user-1');
      expect(result.email).toBe('test@saferide.com');
      expect(result.school).toBeDefined();
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getProfile('nonexistent')).rejects.toThrow(UnauthorizedException);
    });
  });
});
