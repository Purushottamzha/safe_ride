import { Module } from '@nestjs/common';
import { QRController } from './qr.controller';
import { QRService } from './qr.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [QRController],
  providers: [QRService],
  exports: [QRService],
})
export class QRModule {}
