import {
  Controller,
  Get,
  Query,
  Res,
  UseGuards,
  Headers,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ExportService } from './export.service';
import { PrismaService } from '../../database/prisma.service';
import { Prisma, UserRole } from '@prisma/client';

@ApiTags('Export')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('export')
export class ExportController {
  constructor(
    private readonly exportService: ExportService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('attendance')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Export attendance data as CSV' })
  async exportAttendance(
    @Query('format') format: string,
    @Query('fromDate') fromDate: string,
    @Query('toDate') toDate: string,
    @Query('schoolId') schoolId: string,
    @CurrentUser() user: { id: string; role: string; schoolId?: string },
    @Res() res: Response,
    @Headers('accept') accept: string,
  ) {
    const effectiveSchoolId =
      user.role === UserRole.SUPER_ADMIN ? schoolId : user.schoolId;

    const where: Prisma.AttendanceWhereInput = {};
    if (effectiveSchoolId) where.schoolId = effectiveSchoolId;
    if (fromDate || toDate) {
      where.date = {};
      if (fromDate) where.date.gte = new Date(fromDate);
      if (toDate) where.date.lte = new Date(toDate);
    }

    const attendanceRecords = await this.prisma.attendance.findMany({
      where,
      include: {
        student: {
          select: { firstName: true, lastName: true, studentId: true, grade: true, section: true },
        },
        trip: { select: { type: true } },
      },
      orderBy: { date: 'desc' },
    });

    const headers = [
      'Student ID',
      'First Name',
      'Last Name',
      'Grade',
      'Section',
      'Date',
      'Trip Type',
      'Status',
      'Late Minutes',
      'Board Time',
      'Exit Time',
    ];

    const data = attendanceRecords.map((record) => ({
      'Student ID': record.student.studentId,
      'First Name': record.student.firstName,
      'Last Name': record.student.lastName,
      'Grade': record.student.grade,
      'Section': record.student.section || '',
      'Date': record.date.toISOString().split('T')[0],
      'Trip Type': record.trip?.type || '',
      'Status': record.status,
      'Late Minutes': record.lateMinutes,
      'Board Time': record.boardTime?.toISOString() || '',
      'Exit Time': record.exitTime?.toISOString() || '',
    }));

    const formatValue = format || (accept?.includes('excel') ? 'excel' : 'csv');

    let csv: string;
    let contentType: string;
    let filename: string;

    if (formatValue === 'excel') {
      csv = this.exportService.exportToExcel(data, headers);
      contentType = 'application/vnd.ms-excel';
      filename = 'attendance-export.xls';
    } else if (formatValue === 'pdf') {
      csv = this.exportService.exportToPdf(JSON.stringify(data));
      contentType = 'text/csv';
      filename = 'attendance-export.csv';
    } else {
      csv = this.exportService.exportToCsv(data, headers);
      contentType = 'text/csv';
      filename = 'attendance-export.csv';
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`,
    );
    res.send(csv);
  }

  @Get('report')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Generic report export' })
  async exportReport(
    @Query('format') format: string,
    @Query('fromDate') fromDate: string,
    @Query('toDate') toDate: string,
    @Query('type') type: string,
    @Query('schoolId') schoolId: string,
    @CurrentUser() user: { id: string; role: string; schoolId?: string },
    @Res() res: Response,
  ) {
    const effectiveSchoolId =
      user.role === UserRole.SUPER_ADMIN ? schoolId : user.schoolId;

    const where: Record<string, unknown> = {};
    if (effectiveSchoolId) where.schoolId = effectiveSchoolId;
    if (fromDate || toDate) {
      const dateFilter: Record<string, Date> = {};
      if (fromDate) dateFilter.gte = new Date(fromDate);
      if (toDate) dateFilter.lte = new Date(toDate);
      where.createdAt = dateFilter;
    }

    let data: Record<string, unknown>[] = [];
    let headers: string[] = [];

    if (type === 'trips') {
      const trips = await this.prisma.trip.findMany({
        where,
        include: {
          bus: { select: { plateNumber: true, busNumber: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      headers = ['Trip ID', 'Type', 'Status', 'Scheduled At', 'Started At', 'Completed At', 'Bus Plate', 'Bus Number'];
      data = trips.map((t) => ({
        'Trip ID': t.id,
        'Type': t.type,
        'Status': t.status,
        'Scheduled At': t.scheduledAt.toISOString(),
        'Started At': t.startedAt?.toISOString() || '',
        'Completed At': t.completedAt?.toISOString() || '',
        'Bus Plate': t.bus?.plateNumber || '',
        'Bus Number': t.bus?.busNumber || '',
      }));
    } else if (type === 'incidents') {
      const incidents = await this.prisma.incident.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });
      headers = ['Incident ID', 'Title', 'Severity', 'Status', 'Created At', 'Resolved At'];
      data = incidents.map((i) => ({
        'Incident ID': i.id,
        'Title': i.title,
        'Severity': i.severity,
        'Status': i.status,
        'Created At': i.createdAt.toISOString(),
        'Resolved At': i.resolvedAt?.toISOString() || '',
      }));
    } else {
      const students = await this.prisma.student.findMany({
        where: effectiveSchoolId ? { schoolId: effectiveSchoolId } : {},
        orderBy: { createdAt: 'desc' },
      });
      headers = ['Student ID', 'First Name', 'Last Name', 'Grade', 'Section', 'Status'];
      data = students.map((s) => ({
        'Student ID': s.studentId,
        'First Name': s.firstName,
        'Last Name': s.lastName,
        'Grade': s.grade,
        'Section': s.section || '',
        'Status': s.isActive ? 'Active' : 'Inactive',
      }));
    }

    const formatValue = format || 'csv';
    let csv: string;
    let contentType: string;
    let filename: string;

    if (formatValue === 'excel') {
      csv = this.exportService.exportToExcel(data, headers);
      contentType = 'application/vnd.ms-excel';
      filename = `${type || 'report'}-export.xls`;
    } else if (formatValue === 'pdf') {
      csv = this.exportService.exportToPdf(JSON.stringify(data));
      contentType = 'text/csv';
      filename = `${type || 'report'}-export.csv`;
    } else {
      csv = this.exportService.exportToCsv(data, headers);
      contentType = 'text/csv';
      filename = `${type || 'report'}-export.csv`;
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  }
}
