import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MaintenanceService } from './maintenance.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { MaintenanceType, MaintenancePriority, ServiceStatus, InspectionResult, FuelType, DocumentType } from '@prisma/client';

@ApiTags('Maintenance')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('maintenance')
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Get('vehicles')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Get vehicle health for all buses' })
  async getVehicleHealth(@CurrentUser() user: { schoolId: string }) {
    return this.maintenanceService.getVehicleHealth(user.schoolId);
  }

  @Get('schedules')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Get service schedules' })
  async getServiceSchedules(@CurrentUser() user: { schoolId: string }) {
    return this.maintenanceService.getServiceSchedules(user.schoolId);
  }

  @Get('inspections')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Get inspection records' })
  async getInspections(@CurrentUser() user: { schoolId: string }) {
    return this.maintenanceService.getInspections(user.schoolId);
  }

  @Post('records')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Create maintenance record' })
  async createMaintenance(
    @CurrentUser() user: { schoolId: string },
    @Body() body: { busId: string; type: MaintenanceType; description: string; priority?: MaintenancePriority; scheduledAt?: string; cost?: number; vendor?: string; notes?: string },
  ) {
    return this.maintenanceService.createMaintenance({ ...body, schoolId: user.schoolId });
  }

  @Get('records')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'List maintenance records' })
  async getMaintenanceRecords(
    @CurrentUser() user: { schoolId: string },
    @Query('busId') busId?: string,
  ) {
    return this.maintenanceService.getMaintenanceRecords(user.schoolId, busId);
  }

  @Post('records/:id/status')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Update maintenance record status' })
  async updateMaintenanceStatus(@Param('id') id: string, @Body() body: { status: ServiceStatus }) {
    return this.maintenanceService.updateMaintenanceStatus(id, body.status);
  }

  @Post('schedules')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Create service schedule' })
  async createServiceSchedule(
    @CurrentUser() user: { schoolId: string },
    @Body() body: { busId: string; type: MaintenanceType; description: string; scheduledAt: string; assignedTo?: string; notes?: string },
  ) {
    return this.maintenanceService.createServiceSchedule({ ...body, schoolId: user.schoolId });
  }

  @Post('schedules/:id/status')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  async updateScheduleStatus(@Param('id') id: string, @Body() body: { status: ServiceStatus }) {
    return this.maintenanceService.updateServiceScheduleStatus(id, body.status);
  }

  @Post('inspections')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Create inspection record' })
  async createInspection(
    @CurrentUser() user: { schoolId: string },
    @Body() body: { busId: string; inspectorName: string; date: string; result?: InspectionResult; notes?: string; nextInspectionDate?: string },
  ) {
    return this.maintenanceService.createInspection({ ...body, schoolId: user.schoolId });
  }

  @Post('inspections/:id/result')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  async updateInspectionResult(@Param('id') id: string, @Body() body: { result: InspectionResult; notes?: string }) {
    return this.maintenanceService.updateInspectionResult(id, body.result, body.notes);
  }

  // ── Fuel ─────────────────────────────────────────────────────────────

  @Post('fuel')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Add fuel log entry' })
  async createFuelLog(
    @CurrentUser() user: { schoolId: string },
    @Body() body: { busId: string; liters: number; costPerLiter: number; totalCost: number; odometer?: number; fuelType?: FuelType; station?: string; notes?: string },
  ) {
    return this.maintenanceService.createFuelLog({ ...body, schoolId: user.schoolId });
  }

  @Get('fuel')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'List fuel logs' })
  async getFuelLogs(@CurrentUser() user: { schoolId: string }, @Query('busId') busId?: string) {
    return this.maintenanceService.getFuelLogs(user.schoolId, busId);
  }

  // ── Insurance ────────────────────────────────────────────────────────

  @Post('insurance')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Create insurance policy' })
  async createInsurance(
    @CurrentUser() user: { schoolId: string },
    @Body() body: { busId: string; provider: string; policyNumber: string; startDate: string; expiryDate: string; coverage?: string; premium?: number; notes?: string },
  ) {
    return this.maintenanceService.createInsurancePolicy({ ...body, schoolId: user.schoolId });
  }

  @Get('insurance')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'List insurance policies' })
  async getInsurance(@CurrentUser() user: { schoolId: string }) {
    return this.maintenanceService.getInsurancePolicies(user.schoolId);
  }

  // ── Documents ────────────────────────────────────────────────────────

  @Post('documents')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Upload vehicle document' })
  async createDocument(
    @CurrentUser() user: { schoolId: string },
    @Body() body: { busId: string; type: DocumentType; documentNumber?: string; issueDate?: string; expiryDate?: string; fileUrl?: string; notes?: string },
  ) {
    return this.maintenanceService.createVehicleDocument({ ...body, schoolId: user.schoolId });
  }

  @Get('documents')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'List vehicle documents' })
  async getDocuments(@CurrentUser() user: { schoolId: string }) {
    return this.maintenanceService.getVehicleDocuments(user.schoolId);
  }

  // ── Reminders ────────────────────────────────────────────────────────

  @Get('reminders')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Get active service reminders' })
  async getReminders(@CurrentUser() user: { schoolId: string }) {
    return this.maintenanceService.getServiceReminders(user.schoolId);
  }

  // ── Dashboard ────────────────────────────────────────────────────────

  @Get('dashboard')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Get fleet dashboard summary' })
  async getDashboard(@CurrentUser() user: { schoolId: string }) {
    return this.maintenanceService.getFleetDashboard(user.schoolId);
  }
}
