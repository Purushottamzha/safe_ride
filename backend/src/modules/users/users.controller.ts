import { Controller, Get, Post, Put, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthService } from '../auth/auth.service';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

  @Get()
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'List all users with pagination' })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
    @Query('schoolId') schoolId?: string,
  ) {
    return this.usersService.findAll({
      page: page ? parseInt(page.toString(), 10) : 1,
      limit: limit ? parseInt(limit.toString(), 10) : 10,
      search,
      role: role as never,
      status: status as never,
      schoolId,
    });
  }

  @Post()
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Create a new user' })
  async create(@Body() data: { email: string; password: string; firstName: string; lastName: string; phone?: string; role: string; schoolId?: string }) {
    return this.authService.register(data as never);
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Get user by ID' })
  async findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Put(':id')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Update user' })
  async update(@Param('id') id: string, @Body() data: Record<string, unknown>) {
    return this.usersService.update(id, data as never);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Soft delete user' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.usersService.softDelete(id);
  }
}
