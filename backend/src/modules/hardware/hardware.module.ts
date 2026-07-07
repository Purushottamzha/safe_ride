import { Module } from '@nestjs/common';
import { HardwareController } from './hardware.controller';
import { HardwareService } from './hardware.service';
import { QRModule } from '../qr/qr.module';

@Module({
  imports: [QRModule],
  controllers: [HardwareController],
  providers: [HardwareService],
  exports: [HardwareService],
})
export class HardwareModule {}
