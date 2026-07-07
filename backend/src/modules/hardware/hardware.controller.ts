import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { HardwareService } from './hardware.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Hardware')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('hardware')
export class HardwareController {
  constructor(private readonly hardwareService: HardwareService) {}

  @Get('gps/:busId')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'DRIVER')
  @ApiOperation({ summary: 'Get current GPS location of a bus' })
  async getCurrentLocation(@Param('busId') busId: string) {
    return this.hardwareService.getCurrentLocation(busId);
  }

  @Post('gps/:busId/update')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'DRIVER')
  @ApiOperation({ summary: 'Update GPS location of a bus' })
  async updateGPS(
    @Param('busId') busId: string,
    @Body() data: { latitude: number; longitude: number; speed?: number; heading?: number },
  ) {
    return this.hardwareService.processGPSUpdate(
      busId,
      data.latitude,
      data.longitude,
      data.speed,
      data.heading,
    );
  }

  @Get('gps/:busId/history')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Get GPS route history' })
  async getRouteHistory(
    @Param('busId') busId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.hardwareService.getRouteHistory(busId, new Date(startDate), new Date(endDate));
  }

  @Post('tracking/:busId/start')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Start GPS tracking for a bus' })
  async startTracking(@Param('busId') busId: string, @Body() data: { intervalMs?: number }) {
    await this.hardwareService.startTracking(busId, data.intervalMs || 5000);
    return { message: `Tracking started for bus ${busId}` };
  }

  @Post('tracking/:busId/stop')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Stop GPS tracking for a bus' })
  async stopTracking(@Param('busId') busId: string) {
    await this.hardwareService.stopTracking(busId);
    return { message: `Tracking stopped for bus ${busId}` };
  }

  @Get('camera/:busId')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Get latest camera capture' })
  async getLatestCapture(@Param('busId') busId: string) {
    return this.hardwareService.getLatestCapture(busId);
  }

  @Get('device/:deviceId/status')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Get device status' })
  async getDeviceStatus(@Param('deviceId') deviceId: string) {
    return this.hardwareService.getDeviceStatus(deviceId);
  }

  @Post('device/register')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Register a hardware device' })
  async registerDevice(
    @Body()
    data: {
      id: string;
      type: string;
      name: string;
      model?: string;
      firmwareVersion?: string;
    },
  ) {
    return this.hardwareService.registerDevice(data as never);
  }

  @Post('event')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Handle IoT event from hardware' })
  async handleEvent(
    @Body()
    event: {
      deviceId: string;
      deviceType: string;
      eventType: string;
      payload: Record<string, unknown>;
    },
  ) {
    await this.hardwareService.handleEvent(event as never);
    return { message: 'Event handled' };
  }

  @Post('face/verify')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'DRIVER')
  @ApiOperation({ summary: 'Verify student face (dummy)' })
  async verifyFace(@Body() data: { studentId: string; imageData: string }) {
    return this.hardwareService.verifyStudent(data.studentId, data.imageData);
  }
}
