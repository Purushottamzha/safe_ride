import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DriverSafetyController } from './driver-safety.controller';
import { DriverSafetyService } from './driver-safety.service';

@Module({
  imports: [AuthModule],
  controllers: [DriverSafetyController],
  providers: [DriverSafetyService],
  exports: [DriverSafetyService],
})
export class DriverSafetyModule {}
