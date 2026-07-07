import { Controller, Get, Post, Param, Body, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { HardwareService } from './hardware.service';
import { QRService } from '../qr/qr.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { DeviceApiKeyGuard } from './guards/device-api-key.guard';
import { QrScanDto } from './dto/qr-scan.dto';

@ApiTags('Hardware')
@Controller('hardware')
export class HardwareController {
  constructor(
    private readonly hardwareService: HardwareService,
    private readonly qrService: QRService,
  ) {}

  @Get('gps/:busId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'DRIVER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current GPS location of a bus' })
  async getCurrentLocation(@Param('busId') busId: string) {
    return this.hardwareService.getCurrentLocation(busId);
  }

  @Post('gps/:busId/update')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'DRIVER')
  @ApiBearerAuth('JWT-auth')
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get GPS route history' })
  async getRouteHistory(
    @Param('busId') busId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.hardwareService.getRouteHistory(busId, new Date(startDate), new Date(endDate));
  }

  @Post('tracking/:busId/start')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Start GPS tracking for a bus' })
  async startTracking(@Param('busId') busId: string, @Body() data: { intervalMs?: number }) {
    await this.hardwareService.startTracking(busId, data.intervalMs || 5000);
    return { message: `Tracking started for bus ${busId}` };
  }

  @Post('tracking/:busId/stop')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Stop GPS tracking for a bus' })
  async stopTracking(@Param('busId') busId: string) {
    await this.hardwareService.stopTracking(busId);
    return { message: `Tracking stopped for bus ${busId}` };
  }

  @Get('camera/:busId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get latest camera capture' })
  async getLatestCapture(@Param('busId') busId: string) {
    return this.hardwareService.getLatestCapture(busId);
  }

  @Get('device/:deviceId/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get device status' })
  async getDeviceStatus(@Param('deviceId') deviceId: string) {
    return this.hardwareService.getDeviceStatus(deviceId);
  }

  @Post('device/register')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiBearerAuth('JWT-auth')
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiBearerAuth('JWT-auth')
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'DRIVER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Verify student face (dummy)' })
  async verifyFace(@Body() data: { studentId: string; imageData: string }) {
    return this.hardwareService.verifyStudent(data.studentId, data.imageData);
  }

  @Post('qr-scan')
  @UseGuards(DeviceApiKeyGuard)
  @ApiOperation({
    summary: 'Scan a student QR code from a hardware camera device',
    description: 'Device-agnostic endpoint. Accepts QR token, looks up the active trip, determines scan direction, and records attendance. Works with webcam demo or ESP32-CAM.',
  })
  async scanQR(@Body() dto: QrScanDto) {
    const student = await this.qrService.validateQRToken(dto.qrToken);
    const studentId = student.student.id;

    let tripId = dto.tripId;
    if (!tripId && dto.busId) {
      const activeTrip = await this.hardwareService.findActiveTripForBus(dto.busId);
      tripId = activeTrip.id;
    }
    if (!tripId) {
      throw new BadRequestException('Either tripId or busId is required');
    }

    const trip = await this.hardwareService.getTripById(tripId);
    const scanType = this.hardwareService.determineScanType(trip);

    const { event } = await this.qrService.scanQR({
      studentId,
      tripId,
      scanType,
      latitude: undefined,
      longitude: undefined,
    });

    return {
      success: true,
      scanType,
      student: {
        id: student.student.id,
        firstName: student.student.firstName,
        lastName: student.student.lastName,
        studentId: student.student.studentId,
        grade: student.student.grade,
        section: student.student.section,
        profilePicture: student.student.profilePicture,
      },
      trip: {
        id: trip.id,
        type: trip.type,
        status: trip.status,
      },
      message: `Student ${scanType === 'BOARD_IN' ? 'boarded' : 'exited'} successfully`,
      timestamp: new Date().toISOString(),
    };
  }
}
