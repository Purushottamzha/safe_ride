import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('SafeRide API (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let refreshTokenValue: string;
  let schoolId: string;
  let driverId: string;
  let busId: string;
  let routeId: string;
  let tripId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health Check', () => {
    it('GET /api/v1/health should return ok', () => {
      return request(app.getHttpServer())
        .get('/api/v1/health')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.status).toBe('ok');
        });
    });
  });

  describe('Auth', () => {
    const testUser = {
      email: 'test-e2e@saferide.com',
      password: 'TestPass123!',
      firstName: 'Test',
      lastName: 'User',
    };

    it('POST /api/v1/auth/register should create user', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.user.email).toBe(testUser.email);
        });
    });

    it('POST /api/v1/auth/login should return tokens', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: testUser.password })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.tokens.accessToken).toBeDefined();
          expect(res.body.data.tokens.refreshToken).toBeDefined();
          accessToken = res.body.data.tokens.accessToken;
          refreshTokenValue = res.body.data.tokens.refreshToken;
        });
    });

    it('POST /api/v1/auth/login with wrong password should return 401', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: 'WrongPass123!' })
        .expect(401);
    });

    it('GET /api/v1/auth/profile with token should return user data', () => {
      return request(app.getHttpServer())
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.email).toBe(testUser.email);
        });
    });

    it('GET /api/v1/auth/profile without token should return 401', () => {
      return request(app.getHttpServer()).get('/api/v1/auth/profile').expect(401);
    });

    it('POST /api/v1/auth/refresh should return new tokens', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: refreshTokenValue })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.accessToken).toBeDefined();
          expect(res.body.data.refreshToken).toBeDefined();
          accessToken = res.body.data.accessToken;
          refreshTokenValue = res.body.data.refreshToken;
        });
    });

    it('POST /api/v1/auth/logout should clear session', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);
    });
  });

  describe('CRUD Operations', () => {
    const schoolData = {
      name: 'E2E Test School',
      code: 'E2E-TS-' + Date.now(),
      address: 'Kathmandu',
      phone: '+977-9800000000',
      email: 'school-e2e@saferide.com',
    };

    it('POST /api/v1/schools should create a school', () => {
      return request(app.getHttpServer())
        .post('/api/v1/schools')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(schoolData)
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.name).toBe(schoolData.name);
          schoolId = res.body.data.id;
        });
    });

    it('POST /api/v1/students should create a student', () => {
      return request(app.getHttpServer())
        .post('/api/v1/students')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          firstName: 'E2E',
          lastName: 'Student',
          dateOfBirth: '2012-01-01',
          grade: '5',
          section: 'A',
          address: 'Kathmandu',
          schoolId,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });

    it('POST /api/v1/users should create a driver user', () => {
      return request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          email: `driver-e2e-${Date.now()}@saferide.com`,
          password: 'DriverPass123!',
          firstName: 'E2E',
          lastName: 'Driver',
          role: 'DRIVER',
          schoolId,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          driverId = res.body.data.id;
        });
    });

    it('POST /api/v1/buses should create a bus', () => {
      return request(app.getHttpServer())
        .post('/api/v1/buses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          plateNumber: `E2E-${Date.now()}`,
          busNumber: `B-E2E-${Date.now()}`,
          capacity: 40,
          schoolId,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          busId = res.body.data.id;
        });
    });

    it('POST /api/v1/routes should create a route', () => {
      return request(app.getHttpServer())
        .post('/api/v1/routes')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'E2E Route',
          code: `R-E2E-${Date.now()}`,
          schoolId,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          routeId = res.body.data.id;
        });
    });

    it('POST /api/v1/trips should create a trip', () => {
      return request(app.getHttpServer())
        .post('/api/v1/trips')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          type: 'MORNING',
          scheduledAt: '2026-01-20T07:00:00Z',
          driverId,
          busId,
          routeId,
          schoolId,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          tripId = res.body.data.id;
        });
    });

    it('PATCH /api/v1/trips/:id/start should start the trip', () => {
      return request(app.getHttpServer())
        .patch(`/api/v1/trips/${tripId}/start`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.status).toBe('ACTIVE');
        });
    });

    it('PATCH /api/v1/trips/:id/complete should complete the trip', () => {
      return request(app.getHttpServer())
        .patch(`/api/v1/trips/${tripId}/complete`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.status).toBe('COMPLETED');
        });
    });
  });
});
