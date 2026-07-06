import { Controller, Get, Post, Put, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BusesService } from './buses.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { BusStatus } from '@prisma/client';

@ApiTags('Buses')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('buses')
export class BusesController {
  constructor(private readonly busesService: BusesService) {}

  @Get()
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'List buses with pagination' })
  async findAll(
    @Query('page') page?: number, @Query('limit') limit?: number,
    @Query('search') search?: string, @Query('schoolId') schoolId?: string,
    @Query('status') status?: BusStatus,
  ) {
    return this.busesService.findAll({ page, limit, search, schoolId, status });
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Get bus by ID' })
  async findById(@Param('id') id: string) {
    return this.busesService.findById(id);
  }

  @Post()
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Create a bus' })
  async create(@Body() data: {
    plateNumber: string; busNumber: string; model?: string; capacity: number;
    year?: number; color?: string; status?: BusStatus; gpsDeviceId?: string;
    cameraDeviceId?: string; schoolId: string;
  }) {
    return this.busesService.create(data);
  }

  @Put(':id')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Update bus' })
  async update(@Param('id') id: string, @Body() data: Record<string, unknown>) {
    return this.busesService.update(id, data as never);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Soft delete bus' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.busesService.softDelete(id);
  }
}
