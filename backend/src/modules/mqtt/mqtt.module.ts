import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../database/prisma.module';
import { QRModule } from '../qr/qr.module';
import { HardwareModule } from '../hardware/hardware.module';
import { MqttService } from './mqtt.service';
import { MqttCredentialsService } from './mqtt-credentials.service';
import { MqttCredentialsController } from './mqtt-credentials.controller';

@Module({
  imports: [ConfigModule, PrismaModule, QRModule, HardwareModule],
  controllers: [MqttCredentialsController],
  providers: [MqttService, MqttCredentialsService],
  exports: [MqttService, MqttCredentialsService],
})
export class MqttModule {}
