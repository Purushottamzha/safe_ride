import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Analytics')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'School overview statistics' })
  async getOverview(@Query('schoolId') schoolId?: string) {
    return this.analyticsService.getOverview(schoolId);
  }

  @Get('attendance-trends')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Attendance trends over time' })
  async getAttendanceTrends(@Query('schoolId') schoolId?: string, @Query('days') days?: number) {
    return this.analyticsService.getAttendanceTrends(schoolId, days ?? 30);
  }

  @Get('driver-ranking')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Driver performance ranking' })
  async getDriverRanking(@Query('schoolId') schoolId?: string) {
    return this.analyticsService.getDriverRanking(schoolId);
  }

  @Get('delay-metrics')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Delay metrics by route' })
  async getDelayMetrics(@Query('schoolId') schoolId?: string) {
    return this.analyticsService.getDelayMetrics(schoolId);
  }

  @Get('fleet-utilization')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Fleet utilization stats' })
  async getFleetUtilization(@Query('schoolId') schoolId?: string) {
    return this.analyticsService.getFleetUtilization(schoolId);
  }
}
