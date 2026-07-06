import { Controller, Get, Post, Put, Delete, Param, Query, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IncidentsService } from './incidents.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { IncidentSeverity, IncidentStatus } from '@prisma/client';
import { Request } from 'express';

@ApiTags('Incidents')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('incidents')
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @Get()
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'DRIVER')
  @ApiOperation({ summary: 'List incidents with pagination' })
  async findAll(
    @Query('page') page?: number, @Query('limit') limit?: number,
    @Query('severity') severity?: IncidentSeverity, @Query('status') status?: IncidentStatus,
    @Query('reportedById') reportedById?: string, @Query('tripId') tripId?: string,
    @Query('schoolId') schoolId?: string,
    @Query('startDate') startDate?: string, @Query('endDate') endDate?: string,
  ) {
    return this.incidentsService.findAll({ page, limit, severity, status, reportedById, tripId, schoolId, startDate, endDate });
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'DRIVER')
  @ApiOperation({ summary: 'Get incident by ID' })
  async findById(@Param('id') id: string) {
    return this.incidentsService.findById(id);
  }

  @Post()
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'DRIVER')
  @ApiOperation({ summary: 'Report an incident' })
  async create(@Req() req: Request, @Body() data: {
    title: string; description: string; severity?: IncidentSeverity;
    latitude?: number; longitude?: number; location?: string;
    tripId?: string; studentId?: string; busId?: string; imageUrls?: string[];
  }) {
    return this.incidentsService.create({ ...data, reportedById: (req as any).user.id });
  }

  @Put(':id')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Update incident' })
  async update(@Param('id') id: string, @Body() data: Record<string, unknown>) {
    return this.incidentsService.update(id, data as never);
  }

  @Post(':id/resolve')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Resolve an incident' })
  async resolve(@Req() req: Request, @Param('id') id: string, @Body() body: { resolution: string }) {
    return this.incidentsService.resolve(id, body.resolution, (req as any).user.id);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Soft delete incident' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.incidentsService.softDelete(id);
  }
}
