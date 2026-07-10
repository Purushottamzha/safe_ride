import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TelemetryModule } from '../telemetry/telemetry.module';
import { TrackingGateway } from './tracking.gateway';

@Module({
  imports: [AuthModule, TelemetryModule],
  providers: [TrackingGateway],
  exports: [TrackingGateway],
})
export class TrackingModule {}
