import { Controller, Get, Post, Put, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TripsService } from './trips.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TripType, TripStatus } from '@prisma/client';

@ApiTags('Trips')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('trips')
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Get()
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'DRIVER')
  @ApiOperation({ summary: 'List trips with pagination' })
  async findAll(
    @Query('page') page?: number, @Query('limit') limit?: number,
    @Query('schoolId') schoolId?: string, @Query('status') status?: TripStatus,
    @Query('type') type?: TripType, @Query('driverId') driverId?: string,
    @Query('busId') busId?: string, @Query('routeId') routeId?: string,
    @Query('startDate') startDate?: string, @Query('endDate') endDate?: string,
  ) {
    return this.tripsService.findAll({ page, limit, schoolId, status, type, driverId, busId, routeId, startDate, endDate });
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'DRIVER')
  @ApiOperation({ summary: 'Get trip by ID' })
  async findById(@Param('id') id: string) {
    return this.tripsService.findById(id);
  }

  @Post()
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Create a trip' })
  async create(@Body() data: {
    type: TripType; scheduledAt: string; driverId?: string; busId?: string;
    routeId?: string; assignmentId?: string; schoolId: string; notes?: string;
  }) {
    return this.tripsService.create(data);
  }

  @Put(':id')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Update trip' })
  async update(@Param('id') id: string, @Body() data: Record<string, unknown>) {
    return this.tripsService.update(id, data as never);
  }

  @Post(':id/start')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'DRIVER')
  @ApiOperation({ summary: 'Start a trip' })
  async startTrip(@Param('id') id: string) {
    return this.tripsService.startTrip(id);
  }

  @Post(':id/complete')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'DRIVER')
  @ApiOperation({ summary: 'Complete a trip' })
  async completeTrip(@Param('id') id: string) {
    return this.tripsService.completeTrip(id);
  }

  @Post(':id/cancel')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Cancel a trip' })
  async cancelTrip(@Param('id') id: string, @Body() body?: { reason?: string }) {
    return this.tripsService.cancelTrip(id, body?.reason);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Soft delete trip' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.tripsService.softDelete(id);
  }
}
