import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationGateway } from './notification.gateway';
import { EmailService } from './email.service';
import { NotificationPreferencesService } from './notification-preferences.service';
import { NotificationRulesService } from './notification-rules.service';
import { NotificationPreferencesController } from './notification-preferences.controller';

@Module({
  imports: [AuthModule],
  controllers: [NotificationsController, NotificationPreferencesController],
  providers: [
    NotificationsService,
    NotificationGateway,
    EmailService,
    NotificationPreferencesService,
    NotificationRulesService,
  ],
  exports: [
    NotificationsService,
    NotificationGateway,
    EmailService,
    NotificationPreferencesService,
    NotificationRulesService,
  ],
})
export class NotificationsModule {}
