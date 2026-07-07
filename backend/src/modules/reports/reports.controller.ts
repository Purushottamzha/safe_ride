import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Reports')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('daily-attendance')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Get daily attendance report' })
  @ApiQuery({ name: 'schoolId', required: true })
  @ApiQuery({ name: 'date', required: true, example: '2026-01-15' })
  async getDailyAttendance(@Query('schoolId') schoolId: string, @Query('date') date: string) {
    return this.reportsService.getDailyAttendance(schoolId, date);
  }

  @Get('monthly-attendance')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Get monthly attendance report' })
  @ApiQuery({ name: 'schoolId', required: true })
  @ApiQuery({ name: 'month', required: true, example: 1 })
  @ApiQuery({ name: 'year', required: true, example: 2026 })
  async getMonthlyAttendance(
    @Query('schoolId') schoolId: string,
    @Query('month') month: number,
    @Query('year') year: number,
  ) {
    return this.reportsService.getMonthlyAttendance(schoolId, month, year);
  }

  @Get('driver-performance')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Get driver performance report' })
  @ApiQuery({ name: 'schoolId', required: true })
  @ApiQuery({ name: 'fromDate', required: true })
  @ApiQuery({ name: 'toDate', required: true })
  @ApiQuery({ name: 'driverId', required: false })
  async getDriverPerformance(
    @Query('schoolId') schoolId: string,
    @Query('fromDate') fromDate: string,
    @Query('toDate') toDate: string,
    @Query('driverId') driverId?: string,
  ) {
    return this.reportsService.getDriverPerformance(schoolId, fromDate, toDate, driverId);
  }

  @Get('bus-utilization')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Get bus utilization report' })
  @ApiQuery({ name: 'schoolId', required: true })
  @ApiQuery({ name: 'fromDate', required: true })
  @ApiQuery({ name: 'toDate', required: true })
  @ApiQuery({ name: 'busId', required: false })
  async getBusUtilization(
    @Query('schoolId') schoolId: string,
    @Query('fromDate') fromDate: string,
    @Query('toDate') toDate: string,
    @Query('busId') busId?: string,
  ) {
    return this.reportsService.getBusUtilization(schoolId, fromDate, toDate, busId);
  }

  @Get('late-students')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Get late students report' })
  @ApiQuery({ name: 'schoolId', required: true })
  @ApiQuery({ name: 'fromDate', required: true })
  @ApiQuery({ name: 'toDate', required: true })
  async getLateStudents(
    @Query('schoolId') schoolId: string,
    @Query('fromDate') fromDate: string,
    @Query('toDate') toDate: string,
  ) {
    return this.reportsService.getLateStudents(schoolId, fromDate, toDate);
  }

  @Get('attendance-heatmap')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Get attendance heatmap data by grade/section' })
  @ApiQuery({ name: 'schoolId', required: true })
  @ApiQuery({ name: 'fromDate', required: true })
  @ApiQuery({ name: 'toDate', required: true })
  async getAttendanceHeatmap(
    @Query('schoolId') schoolId: string,
    @Query('fromDate') fromDate: string,
    @Query('toDate') toDate: string,
  ) {
    return this.reportsService.getAttendanceHeatmap(schoolId, fromDate, toDate);
  }

  @Get('trips/summary')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Get trip summary report' })
  @ApiQuery({ name: 'schoolId', required: true })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  async getTripSummary(
    @Query('schoolId') schoolId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportsService.getTripSummary(schoolId, startDate, endDate);
  }

  @Get('students/summary')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Get student summary report' })
  @ApiQuery({ name: 'schoolId', required: true })
  async getStudentSummary(@Query('schoolId') schoolId: string) {
    return this.reportsService.getStudentSummary(schoolId);
  }
}
