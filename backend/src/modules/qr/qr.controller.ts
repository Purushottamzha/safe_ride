import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { QRService } from './qr.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ScanType } from '@prisma/client';

@ApiTags('QR')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('qr')
export class QRController {
  constructor(private readonly qrService: QRService) {}

  @Get('validate')
  @ApiOperation({ summary: 'Validate QR token' })
  async validateQR(@Query('token') token: string) {
    return this.qrService.validateQRToken(token);
  }

  @Post('scan')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Scan QR code for boarding/exiting' })
  async scanQR(
    @Body()
    data: {
      studentId: string;
      tripId: string;
      scanType: ScanType;
      latitude?: number;
      longitude?: number;
    },
  ) {
    return this.qrService.scanQR(data);
  }
}
