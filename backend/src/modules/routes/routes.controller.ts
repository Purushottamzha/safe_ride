import { Controller, Get, Post, Put, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RoutesService } from './routes.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Routes')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('routes')
export class RoutesController {
  constructor(private readonly routesService: RoutesService) {}

  @Get()
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'List routes with pagination' })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('schoolId') schoolId?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.routesService.findAll({
      page,
      limit,
      search,
      schoolId,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
    });
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Get route by ID' })
  async findById(@Param('id') id: string) {
    return this.routesService.findById(id);
  }

  @Post()
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Create a route' })
  async create(
    @Body()
    data: {
      name: string;
      code: string;
      direction?: string;
      distance?: number;
      duration?: number;
      isActive?: boolean;
      schoolId: string;
    },
  ) {
    return this.routesService.create(data);
  }

  @Put(':id')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Update route' })
  async update(@Param('id') id: string, @Body() data: Record<string, unknown>) {
    return this.routesService.update(id, data as never);
  }

  @Post(':id/stops/:stopId')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Add stop to route' })
  async addStop(
    @Param('id') id: string,
    @Param('stopId') stopId: string,
    @Body() body: { sequence: number; distance?: number; duration?: number },
  ) {
    return this.routesService.addStop(id, stopId, body.sequence, body.distance, body.duration);
  }

  @Delete(':id/stops/:stopId')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Remove stop from route' })
  async removeStop(@Param('id') id: string, @Param('stopId') stopId: string) {
    return this.routesService.removeStop(id, stopId);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Soft delete route' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.routesService.softDelete(id);
  }
}
