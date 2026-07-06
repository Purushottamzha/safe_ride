import { Controller, Get, Post, Put, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DriversService } from './drivers.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Drivers')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('drivers')
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  @Get()
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'List drivers with pagination' })
  async findAll(
    @Query('page') page?: number, @Query('limit') limit?: number,
    @Query('search') search?: string, @Query('schoolId') schoolId?: string,
    @Query('isAvailable') isAvailable?: string,
  ) {
    return this.driversService.findAll({
      page, limit, search, schoolId,
      isAvailable: isAvailable !== undefined ? isAvailable === 'true' : undefined,
    });
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Get driver by ID' })
  async findById(@Param('id') id: string) {
    return this.driversService.findById(id);
  }

  @Post()
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Create a driver' })
  async create(@Body() data: {
    userId: string; licenseNumber: string; licenseExpiry: string;
    emergencyContact?: string; medicalNotes?: string; schoolId: string;
  }) {
    return this.driversService.create(data);
  }

  @Put(':id')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Update driver' })
  async update(@Param('id') id: string, @Body() data: Record<string, unknown>) {
    return this.driversService.update(id, data as never);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Soft delete driver' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.driversService.softDelete(id);
  }
}
