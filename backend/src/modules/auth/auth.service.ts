import { Injectable, UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../database/redis.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UserRole } from '@prisma/client';

interface TokenPayload {
  sub: string;
  email: string;
  role: string;
  schoolId?: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    schoolId: string | null;
  };
  tokens: AuthTokens;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION_MINUTES = 15;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private redis: RedisService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
    });

    const role = dto.role || UserRole.SCHOOL_ADMIN;

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        phone: dto.phone,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role,
        schoolId: dto.schoolId || null,
      },
    });

    this.logger.log(`User registered: ${user.email} with role ${role}`);

    return this.generateAuthResponse(user);
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status === 'SUSPENDED' || user.status === 'LOCKED') {
      throw new UnauthorizedException('Account is locked. Please contact administrator.');
    }

    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      throw new UnauthorizedException(
        `Account is temporarily locked. Try again after ${this.LOCKOUT_DURATION_MINUTES} minutes.`,
      );
    }

    const isPasswordValid = await argon2.verify(user.passwordHash, dto.password);

    if (!isPasswordValid) {
      await this.handleFailedLogin(user.id, user.loginAttempts + 1);
      throw new UnauthorizedException('Invalid email or password');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        loginAttempts: 0,
        lockoutUntil: null,
        lastLoginAt: new Date(),
      },
    });

    this.logger.log(`User logged in: ${user.email}`);

    return this.generateAuthResponse(user);
  }

  async refreshToken(dto: RefreshTokenDto): Promise<AuthTokens> {
    try {
      const payload = this.jwtService.verify(dto.refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || user.refreshToken !== dto.refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async logout(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });

    await this.redis.del(`session:${userId}`);
    this.logger.log(`User logged out: ${userId}`);
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isCurrentPasswordValid = await argon2.verify(user.passwordHash, dto.currentPassword);

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const newPasswordHash = await argon2.hash(dto.newPassword, {
      type: argon2.argon2id,
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newPasswordHash,
        refreshToken: null,
      },
    });

    await this.redis.del(`session:${userId}`);
    this.logger.log(`Password changed for user: ${userId}`);
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        isEmailVerified: true,
        isMfaEnabled: true,
        profilePicture: true,
        lastLoginAt: true,
        schoolId: true,
        school: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  private async generateAuthResponse(user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    schoolId: string | null;
  }): Promise<AuthResponse> {
    const tokens = await this.generateTokens(user);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: tokens.refreshToken },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        schoolId: user.schoolId,
      },
      tokens,
    };
  }

  private async generateTokens(user: {
    id: string;
    email: string;
    role: string;
    schoolId?: string | null;
  }): Promise<AuthTokens> {
    const payload: TokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      schoolId: user.schoolId,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.refreshSecret'),
      expiresIn: this.configService.get<string>('jwt.refreshExpiration', '7d'),
    });

    const expiresIn = 15 * 60;

    await this.redis.set(`session:${user.id}`, accessToken, 'EX', expiresIn);

    return { accessToken, refreshToken, expiresIn };
  }

  private async handleFailedLogin(userId: string, attemptCount: number): Promise<void> {
    if (attemptCount >= this.MAX_LOGIN_ATTEMPTS) {
      const lockoutUntil = new Date(Date.now() + this.LOCKOUT_DURATION_MINUTES * 60 * 1000);

      await this.prisma.user.update({
        where: { id: userId },
        data: {
          loginAttempts: attemptCount,
          lockoutUntil,
          status: 'LOCKED',
        },
      });

      this.logger.warn(`User ${userId} locked out due to ${attemptCount} failed login attempts`);

      setTimeout(
        async () => {
          await this.prisma.user.update({
            where: { id: userId },
            data: {
              loginAttempts: 0,
              lockoutUntil: null,
              status: 'ACTIVE',
            },
          });
          this.logger.log(`User ${userId} unlocked after lockout period`);
        },
        this.LOCKOUT_DURATION_MINUTES * 60 * 1000,
      );
    } else {
      await this.prisma.user.update({
        where: { id: userId },
        data: { loginAttempts: attemptCount },
      });
    }
  }
}
