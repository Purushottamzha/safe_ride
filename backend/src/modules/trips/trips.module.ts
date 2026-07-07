import { Module } from '@nestjs/common';
import { TripsController } from './trips.controller';
import { TripsService } from './trips.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { IncidentsModule } from '../incidents/incidents.module';

@Module({
  imports: [NotificationsModule, IncidentsModule],
  controllers: [TripsController],
  providers: [TripsService],
  exports: [TripsService],
})
export class TripsModule {}
