import { Controller, Get, Post, Put, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ParentsService } from './parents.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthService } from '../auth/auth.service';

@ApiTags('Parents')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('parents')
export class ParentsController {
  constructor(
    private readonly parentsService: ParentsService,
    private readonly authService: AuthService,
  ) {}

  @Get('me/children')
  @Roles('PARENT')
  @ApiOperation({ summary: 'Get current parent\'s children with today\'s status' })
  async getMyChildren(@CurrentUser() user: { id: string }) {
    return this.parentsService.getMyChildren(user.id);
  }

  @Get()
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'List parents with pagination' })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('schoolId') schoolId?: string,
  ) {
    return this.parentsService.findAll({ page, limit, search, schoolId });
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Get parent by ID' })
  async findById(@Param('id') id: string) {
    return this.parentsService.findById(id);
  }

  @Post()
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Create a parent' })
  async create(@Body() data: { email: string; firstName: string; lastName: string; phone?: string; emergencyContact?: boolean; schoolId: string }) {
    const user = await this.authService.register({
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      password: 'Parent@123',
      schoolId: data.schoolId,
      role: 'PARENT' as never,
    });
    return this.parentsService.create({ userId: user.user.id, emergencyContact: data.emergencyContact });
  }

  @Put(':id')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Update parent' })
  async update(@Param('id') id: string, @Body() data: { firstName?: string; lastName?: string; phone?: string; emergencyContact?: boolean }) {
    return this.parentsService.update(id, data);
  }

  @Post(':id/students/:studentId')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Link student to parent' })
  async linkStudent(
    @Param('id') id: string,
    @Param('studentId') studentId: string,
    @Body() body: { relation: string; isPrimary?: boolean },
  ) {
    return this.parentsService.linkStudent(id, studentId, body.relation, body.isPrimary);
  }

  @Delete(':id/students/:studentId')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Unlink student from parent' })
  async unlinkStudent(@Param('id') id: string, @Param('studentId') studentId: string) {
    return this.parentsService.unlinkStudent(id, studentId);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Soft delete parent' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.parentsService.softDelete(id);
  }
}
