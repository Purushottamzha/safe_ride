import { Controller, Get, Post, Put, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StudentsService } from './students.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Students')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get()
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'DRIVER')
  @ApiOperation({ summary: 'List students with pagination' })
  async findAll(
    @Query('page') page?: number, @Query('limit') limit?: number,
    @Query('search') search?: string, @Query('schoolId') schoolId?: string,
    @Query('grade') grade?: string, @Query('section') section?: string,
  ) {
    return this.studentsService.findAll({ page, limit, search, schoolId, grade, section });
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'DRIVER', 'PARENT')
  @ApiOperation({ summary: 'Get student by ID' })
  async findById(@Param('id') id: string) {
    return this.studentsService.findById(id);
  }

  @Post()
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Create a student' })
  async create(@Body() data: {
    firstName: string; lastName: string; dateOfBirth: string;
    grade: string; section?: string; address: string;
    phone?: string; schoolId: string; emergencyNotes?: string;
  }) {
    return this.studentsService.create(data);
  }

  @Put(':id')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Update student' })
  async update(@Param('id') id: string, @Body() data: Record<string, unknown>) {
    return this.studentsService.update(id, data as never);
  }

  @Post(':id/regenerate-qr')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Regenerate QR token for student' })
  async regenerateQR(@Param('id') id: string) {
    return this.studentsService.regenerateQR(id);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Soft delete student' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.studentsService.softDelete(id);
  }
}
