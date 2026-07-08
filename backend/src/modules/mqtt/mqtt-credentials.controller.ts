import { Controller, Post, Delete, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MqttCredentialsService } from './mqtt-credentials.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('MQTT Credentials')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('devices/:deviceId/mqtt-credentials')
export class MqttCredentialsController {
  constructor(private readonly mqttCredentialsService: MqttCredentialsService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Provision MQTT credentials for a device' })
  async provision(@Param('deviceId') deviceId: string) {
    return this.mqttCredentialsService.provisionDevice(deviceId);
  }

  @Delete()
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Revoke MQTT credentials for a device' })
  async revoke(@Param('deviceId') deviceId: string) {
    await this.mqttCredentialsService.revokeDevice(deviceId);
    return { message: 'MQTT credentials revoked' };
  }

  @Post('rotate')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Rotate MQTT credentials for a device' })
  async rotate(@Param('deviceId') deviceId: string) {
    return this.mqttCredentialsService.rotateDevice(deviceId);
  }

  @Get()
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Check if device has MQTT credentials' })
  async check(@Param('deviceId') deviceId: string) {
    return { hasCredentials: this.mqttCredentialsService.hasDevice(deviceId) };
  }
}
