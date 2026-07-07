import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './database/prisma.module';
import { RedisModule } from './database/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { SchoolsModule } from './modules/schools/schools.module';
import { StudentsModule } from './modules/students/students.module';
import { ParentsModule } from './modules/parents/parents.module';
import { DriversModule } from './modules/drivers/drivers.module';
import { BusesModule } from './modules/buses/buses.module';
import { RoutesModule } from './modules/routes/routes.module';
import { StopsModule } from './modules/stops/stops.module';
import { TripsModule } from './modules/trips/trips.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ReportsModule } from './modules/reports/reports.module';
import { HardwareModule } from './modules/hardware/hardware.module';
import { QRModule } from './modules/qr/qr.module';
import { IncidentsModule } from './modules/incidents/incidents.module';
import { PendingStudentsModule } from './modules/pending-students/pending-students.module';
import { AssignmentsModule } from './modules/assignments/assignments.module';
import { HealthModule } from './modules/health/health.module';
import { AuditModule } from './modules/audit/audit.module';
import { UploadModule } from './modules/upload/upload.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ExportModule } from './modules/export/export.module';
import { TrackingModule } from './modules/tracking/tracking.module';
import { DriverSafetyModule } from './modules/driver-safety/driver-safety.module';
import { SimulatorModule } from './modules/simulator/simulator.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { DevicesModule } from './modules/devices/devices.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: config.get<number>('throttle.ttl', 60000),
            limit: config.get<number>('throttle.limit', 60),
          },
        ],
      }),
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    RedisModule,
    AuthModule,
    UsersModule,
    SchoolsModule,
    StudentsModule,
    ParentsModule,
    DriversModule,
    BusesModule,
    RoutesModule,
    StopsModule,
    TripsModule,
    AttendanceModule,
    NotificationsModule,
    ReportsModule,
    HardwareModule,
    QRModule,
    IncidentsModule,
    PendingStudentsModule,
    AssignmentsModule,
    HealthModule,
    AuditModule,
    UploadModule,
    DashboardModule,
    ExportModule,
    TrackingModule,
    DriverSafetyModule,
    SimulatorModule,
    AnalyticsModule,
    DevicesModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
