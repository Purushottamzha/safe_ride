import { Controller, Get, Post, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DevicesService } from './devices.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RegisterDeviceDto } from './dto/register-device.dto';

@ApiTags('Devices')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Register a new hardware device and get its API key' })
  async register(@Body() dto: RegisterDeviceDto) {
    return this.devicesService.register(dto);
  }

  @Get()
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'List registered devices' })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('schoolId') schoolId?: string,
  ) {
    return this.devicesService.findAll({ page, limit, schoolId });
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Get device by ID' })
  async findById(@Param('id') id: string) {
    return this.devicesService.findById(id);
  }

  @Post(':id/status')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Update device status' })
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: 'ACTIVE' | 'INACTIVE' | 'ERROR' },
  ) {
    return this.devicesService.updateStatus(id, body.status);
  }

  @Post(':id/rotate-key')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Rotate device API key (invalidates old key)' })
  async rotateKey(@Param('id') id: string) {
    return this.devicesService.rotateApiKey(id);
  }
}
