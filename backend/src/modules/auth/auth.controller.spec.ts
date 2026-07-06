import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UnauthorizedException, ConflictException, HttpStatus } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: Record<string, jest.Mock>;

  beforeEach(async () => {
    authService = {
      register: jest.fn(),
      login: jest.fn(),
      refreshToken: jest.fn(),
      logout: jest.fn(),
      changePassword: jest.fn(),
      getProfile: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  describe('POST /auth/register', () => {
    it('should validate input and return created user', async () => {
      const dto: RegisterDto = {
        email: 'new@saferide.com',
        password: 'SecurePass123!',
        firstName: 'Test',
        lastName: 'User',
      };

      const expectedResult = {
        user: { id: 'user-1', email: dto.email, firstName: dto.firstName, lastName: dto.lastName, role: 'SCHOOL_ADMIN', schoolId: null },
        tokens: { accessToken: 'access-token', refreshToken: 'refresh-token', expiresIn: 900 },
      };

      authService.register.mockResolvedValue(expectedResult);

      const result = await controller.register(dto);

      expect(authService.register).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedResult);
    });

    it('should throw ConflictException for duplicate email', async () => {
      authService.register.mockRejectedValue(new ConflictException('User with this email already exists'));

      await expect(
        controller.register({ email: 'existing@saferide.com', password: 'SecurePass123!', firstName: 'Test', lastName: 'User' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('POST /auth/login', () => {
    it('should return tokens on success', async () => {
      const dto: LoginDto = { email: 'test@saferide.com', password: 'SecurePass123!' };
      const expectedResult = {
        user: { id: 'user-1', email: dto.email, firstName: 'Test', lastName: 'User', role: 'SCHOOL_ADMIN', schoolId: null },
        tokens: { accessToken: 'access-token', refreshToken: 'refresh-token', expiresIn: 900 },
      };

      authService.login.mockResolvedValue(expectedResult);

      const result = await controller.login(dto);

      expect(authService.login).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedResult);
    });

    it('should return 401 on bad credentials', async () => {
      authService.login.mockRejectedValue(new UnauthorizedException('Invalid email or password'));

      await expect(
        controller.login({ email: 'test@saferide.com', password: 'WrongPass123!' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
