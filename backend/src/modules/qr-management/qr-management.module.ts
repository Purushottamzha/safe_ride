import { Module } from '@nestjs/common';
import { QRManagementController } from './qr-management.controller';
import { QRManagementService } from './qr-management.service';

@Module({
  controllers: [QRManagementController],
  providers: [QRManagementService],
  exports: [QRManagementService],
})
export class QRManagementModule {}
