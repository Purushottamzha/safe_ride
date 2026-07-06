import { Controller, Get, Post, Put, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StopsService } from './stops.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Stops')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('stops')
export class StopsController {
  constructor(private readonly stopsService: StopsService) {}

  @Get()
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'List stops with pagination' })
  async findAll(
    @Query('page') page?: number, @Query('limit') limit?: number,
    @Query('search') search?: string, @Query('schoolId') schoolId?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.stopsService.findAll({
      page, limit, search, schoolId,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
    });
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Get stop by ID' })
  async findById(@Param('id') id: string) {
    return this.stopsService.findById(id);
  }

  @Post()
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Create a stop' })
  async create(@Body() data: {
    name: string; address: string; latitude?: number; longitude?: number;
    sequence?: number; isActive?: boolean; schoolId: string;
  }) {
    return this.stopsService.create(data);
  }

  @Put(':id')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Update stop' })
  async update(@Param('id') id: string, @Body() data: Record<string, unknown>) {
    return this.stopsService.update(id, data as never);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Soft delete stop' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.stopsService.softDelete(id);
  }
}
