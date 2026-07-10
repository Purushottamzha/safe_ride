import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TelemetryService } from './telemetry.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Telemetry')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('telemetry')
export class TelemetryController {
  constructor(private readonly telemetryService: TelemetryService) {}

  @Get()
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Get all bus telemetry for the user\'s school' })
  async findAll(@CurrentUser() user: { schoolId: string }) {
    return this.telemetryService.findAllBySchool(user.schoolId);
  }

  @Get('health-summary')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Get aggregated health summary' })
  async getHealthSummary(@CurrentUser() user: { schoolId: string }) {
    return this.telemetryService.getHealthSummary(user.schoolId);
  }

  @Get(':busId')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Get telemetry for a specific bus' })
  async findByBus(@Param('busId') busId: string) {
    return this.telemetryService.findByBus(busId);
  }
}
