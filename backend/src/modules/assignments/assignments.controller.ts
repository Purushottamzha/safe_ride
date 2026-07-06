import { Controller, Get, Post, Put, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AssignmentsService } from './assignments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Assignments')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('assignments')
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Get()
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'List assignments with pagination' })
  async findAll(
    @Query('page') page?: number, @Query('limit') limit?: number,
    @Query('schoolId') schoolId?: string, @Query('routeId') routeId?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.assignmentsService.findAll({
      page, limit, schoolId, routeId,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
    });
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Get assignment by ID' })
  async findById(@Param('id') id: string) {
    return this.assignmentsService.findById(id);
  }

  @Post()
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Create an assignment' })
  async create(@Body() data: { name?: string; schoolId: string; routeId: string; isActive?: boolean }) {
    return this.assignmentsService.create(data);
  }

  @Put(':id')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Update assignment' })
  async update(@Param('id') id: string, @Body() data: Record<string, unknown>) {
    return this.assignmentsService.update(id, data as never);
  }

  @Post(':id/drivers/:driverId')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Assign driver to assignment' })
  async addDriver(
    @Param('id') id: string, @Param('driverId') driverId: string,
    @Body() body?: { isPrimary?: boolean },
  ) {
    return this.assignmentsService.addDriver(id, driverId, body?.isPrimary);
  }

  @Delete(':id/drivers/:driverId')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Remove driver from assignment' })
  async removeDriver(@Param('id') id: string, @Param('driverId') driverId: string) {
    return this.assignmentsService.removeDriver(id, driverId);
  }

  @Post(':id/buses/:busId')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Assign bus to assignment' })
  async addBus(
    @Param('id') id: string, @Param('busId') busId: string,
    @Body() body?: { isPrimary?: boolean },
  ) {
    return this.assignmentsService.addBus(id, busId, body?.isPrimary);
  }

  @Delete(':id/buses/:busId')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Remove bus from assignment' })
  async removeBus(@Param('id') id: string, @Param('busId') busId: string) {
    return this.assignmentsService.removeBus(id, busId);
  }

  @Post(':id/students/:studentId')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Assign student to assignment' })
  async addStudent(
    @Param('id') id: string, @Param('studentId') studentId: string,
    @Body() body?: { stopId?: string },
  ) {
    return this.assignmentsService.addStudent(id, studentId, body?.stopId);
  }

  @Delete(':id/students/:studentId')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Remove student from assignment' })
  async removeStudent(@Param('id') id: string, @Param('studentId') studentId: string) {
    return this.assignmentsService.removeStudent(id, studentId);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Soft delete assignment' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.assignmentsService.softDelete(id);
  }
}
