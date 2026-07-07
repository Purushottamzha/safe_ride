import { Controller, Get, Post, Put, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TripType, AttendanceStatus } from '@prisma/client';

@ApiTags('Attendance')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get()
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'DRIVER', 'PARENT')
  @ApiOperation({ summary: 'List attendance records with pagination' })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('schoolId') schoolId?: string,
    @Query('studentId') studentId?: string,
    @Query('tripId') tripId?: string,
    @Query('date') date?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('type') type?: TripType,
    @Query('status') status?: AttendanceStatus,
  ) {
    return this.attendanceService.findAll({
      page,
      limit,
      schoolId,
      studentId,
      tripId,
      date,
      startDate,
      endDate,
      type,
      status,
    });
  }

  @Get('student/:studentId')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'DRIVER', 'PARENT')
  @ApiOperation({ summary: 'Get attendance by student' })
  async findByStudent(
    @Param('studentId') studentId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.attendanceService.findByStudent(studentId, { page, limit, startDate, endDate });
  }

  @Get('today')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'DRIVER', 'PARENT')
  @ApiOperation({ summary: 'Get today\'s attendance status for a student' })
  async getTodayStatus(
    @Query('studentId') studentId: string,
    @CurrentUser() user: { id: string; role: string; schoolId?: string },
  ) {
    return this.attendanceService.getTodayStatus(studentId, user);
  }

  @Get('range/:schoolId')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Get attendance by date range' })
  async findByDateRange(
    @Param('schoolId') schoolId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.attendanceService.findAll({ schoolId, startDate, endDate, page, limit });
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'DRIVER', 'PARENT')
  @ApiOperation({ summary: 'Get attendance record by ID' })
  async findById(@Param('id') id: string) {
    return this.attendanceService.findById(id);
  }

  @Post()
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Create attendance record' })
  async create(
    @Body()
    data: {
      studentId: string;
      tripId?: string;
      schoolId: string;
      date: string;
      type: TripType;
      boardTime?: string;
      exitTime?: string;
      status?: AttendanceStatus;
      isLate?: boolean;
      lateMinutes?: number;
    },
  ) {
    return this.attendanceService.create(data);
  }

  @Put(':id')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Update attendance record' })
  async update(@Param('id') id: string, @Body() data: Record<string, unknown>) {
    return this.attendanceService.update(id, data as never);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Delete attendance record' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.attendanceService.softDelete(id);
  }
}
