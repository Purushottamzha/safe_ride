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
  async findAll(@Query('page') page?: number, @Query('limit') limit?: number,
    @Query('schoolId') schoolId?: string, @Query('status') status?: TripStatus,
    @Query('type') type?: TripType, @Query('driverId') driverId?: string,
    @Query('busId') busId?: string, @Query('routeId') routeId?: string,
    @Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
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
  async create(@Body() data: { type: TripType; scheduledAt: string; driverId?: string; busId?: string; routeId?: string; assignmentId?: string; schoolId: string; notes?: string }) {
    return this.tripsService.create(data);
  }

  @Put(':id')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Update trip' })
  async update(@Param('id') id: string, @Body() data: Record<string, unknown>) {
    return this.tripsService.update(id, data as never);
  }

  @Post(':id/assign-driver')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Assign driver to trip' })
  async assignDriver(@Param('id') id: string, @Body() body: { driverId: string }) {
    return this.tripsService.assignDriver(id, body.driverId);
  }

  @Post(':id/assign-bus')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Assign bus to trip' })
  async assignBus(@Param('id') id: string, @Body() body: { busId: string }) {
    return this.tripsService.assignBus(id, body.busId);
  }

  @Post(':id/start')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'DRIVER')
  @ApiOperation({ summary: 'Start trip' })
  async startTrip(@Param('id') id: string) {
    return this.tripsService.startTrip(id);
  }

  @Post(':id/reach-stop')
  @Roles('SUPER_ADMIN', 'DRIVER')
  @ApiOperation({ summary: 'Mark stop reached (geofence auto-detected)' })
  async reachStop(@Param('id') id: string, @Body() body: { stopId: string; lat: number; lng: number }) {
    return this.tripsService.reachStop(id, body.stopId, body.lat, body.lng);
  }

  @Post(':id/complete-boarding')
  @Roles('SUPER_ADMIN', 'DRIVER')
  @ApiOperation({ summary: 'Complete boarding at current stop' })
  async completeBoarding(@Param('id') id: string) {
    return this.tripsService.completeBoarding(id);
  }

  @Post(':id/arrive-school')
  @Roles('SUPER_ADMIN', 'DRIVER')
  @ApiOperation({ summary: 'Arrive at school' })
  async arriveAtSchool(@Param('id') id: string) {
    return this.tripsService.arriveAtSchool(id);
  }

  @Post(':id/start-drop')
  @Roles('SUPER_ADMIN', 'DRIVER')
  @ApiOperation({ summary: 'Start drop-off trip' })
  async startDrop(@Param('id') id: string) {
    return this.tripsService.startDrop(id);
  }

  @Post(':id/complete')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'DRIVER')
  @ApiOperation({ summary: 'Complete trip' })
  async completeTrip(@Param('id') id: string, @Body() body?: { notes?: string }) {
    return this.tripsService.completeTrip(id, body);
  }

  @Post(':id/cancel')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Cancel trip' })
  async cancelTrip(@Param('id') id: string, @Body() body?: { reason?: string }) {
    return this.tripsService.cancelTrip(id, body?.reason);
  }

  @Get('calendar/data')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Get trips for calendar view' })
  async getCalendar(@Query('startDate') startDate: string, @Query('endDate') endDate: string,
    @Query('schoolId') schoolId?: string, @Query('type') type?: TripType) {
    return this.tripsService.getCalendar({ startDate, endDate, schoolId, type });
  }

  @Post('check-conflicts')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Check for driver/bus scheduling conflicts' })
  async checkConflicts(@Body() body: { scheduledAt: string; type: TripType; driverId?: string; busId?: string; excludeTripId?: string }) {
    return this.tripsService.checkConflicts(body);
  }

  @Get(':id/replay')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'DRIVER')
  @ApiOperation({ summary: 'Get trip replay data (waypoints + events)' })
  async getReplay(@Param('id') id: string) {
    return this.tripsService.getReplay(id);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Soft delete trip' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.tripsService.softDelete(id);
  }
}
