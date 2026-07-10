import { Controller, Get, Post, Param, Query, Body, Res, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response, Request } from 'express';
import { QRManagementService } from './qr-management.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('QR Management')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('qr')
export class QRManagementController {
  constructor(private readonly qrService: QRManagementService) {}

  @Get('dashboard')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Get QR generation dashboard stats' })
  async getDashboard(@Req() req: Request) {
    const user = (req as any).user;
    const schoolId = user.role === 'SCHOOL_ADMIN' ? user.schoolId : undefined;
    return this.qrService.getDashboardStats(schoolId);
  }

  @Get('student/:studentId')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Get QR info for a student' })
  async getStudentQR(@Param('studentId') studentId: string, @Req() req: Request) {
    const user = (req as any).user;
    const schoolId = user.role === 'SCHOOL_ADMIN' ? user.schoolId : undefined;
    return this.qrService.getStudentQRInfo(studentId, schoolId);
  }

  @Post('student/:studentId/generate')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Generate QR for a student' })
  async generateQR(
    @Param('studentId') studentId: string,
    @Query('force') force: string,
    @Req() req: Request,
  ) {
    const user = (req as any).user;
    const schoolId = user.role === 'SCHOOL_ADMIN' ? user.schoolId : undefined;
    return this.qrService.generateQR(studentId, schoolId, force === 'true');
  }

  @Post('student/:studentId/regenerate')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Regenerate QR (force)' })
  async regenerateQR(@Param('studentId') studentId: string, @Req() req: Request) {
    const user = (req as any).user;
    const schoolId = user.role === 'SCHOOL_ADMIN' ? user.schoolId : undefined;
    return this.qrService.generateQR(studentId, schoolId, true);
  }

  @Post('bulk/generate')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Bulk generate QRs' })
  async bulkGenerate(
    @Body() filters: { grade?: string; section?: string; busId?: string; routeId?: string; studentIds?: string[] },
    @Req() req: Request,
  ) {
    const user = (req as any).user;
    const schoolId = user.role === 'SCHOOL_ADMIN' ? user.schoolId : undefined;
    return this.qrService.bulkGenerate(filters, schoolId);
  }

  @Get('download/:studentId')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Download QR as PNG' })
  async downloadQR(@Param('studentId') studentId: string, @Req() req: Request, @Res() res: Response) {
    const user = (req as any).user;
    const schoolId = user.role === 'SCHOOL_ADMIN' ? user.schoolId : undefined;
    return this.qrService.downloadQR(studentId, schoolId, res);
  }

  @Post('download/bulk')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Download bulk QRs as ZIP' })
  async downloadBulkZip(
    @Body() filters: { grade?: string; section?: string; busId?: string; routeId?: string; studentIds?: string[] },
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const user = (req as any).user;
    const schoolId = user.role === 'SCHOOL_ADMIN' ? user.schoolId : undefined;
    return this.qrService.downloadBulkZip(filters, schoolId, res);
  }

  @Get('print/:studentId')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Get printable card data for a student' })
  async getPrintableCard(@Param('studentId') studentId: string, @Req() req: Request) {
    const user = (req as any).user;
    const schoolId = user.role === 'SCHOOL_ADMIN' ? user.schoolId : undefined;
    return this.qrService.getPrintableCard(studentId, schoolId);
  }

  @Post('print/bulk')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Get printable cards data for bulk printing' })
  async getPrintableCards(
    @Body() filters: { grade?: string; section?: string; busId?: string; studentIds?: string[] },
    @Req() req: Request,
  ) {
    const user = (req as any).user;
    const schoolId = user.role === 'SCHOOL_ADMIN' ? user.schoolId : undefined;
    return this.qrService.getPrintableCards(filters, schoolId);
  }
}
