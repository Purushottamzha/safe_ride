import { Controller, Get, Post, Param, Query, Body, UseGuards, NotFoundException, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PendingStudentsService } from './pending-students.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RegisterStudentDto } from './dto/register-student.dto';
import { ReviewStudentDto } from './dto/review-student.dto';
import { PrismaService } from '../../database/prisma.service';

@ApiTags('Pending Students')
@Controller('pending-students')
export class PendingStudentsController {
  constructor(
    private readonly pendingStudentsService: PendingStudentsService,
    private prisma: PrismaService,
  ) {}

  @Post('register')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PARENT')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Submit a student registration request (parent)' })
  async register(
    @CurrentUser() user: { id: string },
    @Body() dto: RegisterStudentDto,
  ) {
    const parent = await this.prisma.parent.findUnique({ where: { userId: user.id } });
    if (!parent) throw new NotFoundException('Parent profile not found');
    return this.pendingStudentsService.submitRegistration({
      ...dto,
      parentId: parent.id,
    });
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'List pending student requests (admin)' })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('schoolId') schoolId?: string,
    @Query('status') status?: string,
  ) {
    return this.pendingStudentsService.findAllPending({ page, limit, schoolId, status });
  }

  @Get('my-requests')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PARENT')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get my registration requests (parent)' })
  async getMyRequests(@CurrentUser() user: { id: string }) {
    const parent = await this.prisma.parent.findUnique({ where: { userId: user.id } });
    if (!parent) throw new NotFoundException('Parent profile not found');
    return this.pendingStudentsService.getMyRequests(parent.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get pending request by ID' })
  async findById(@Param('id') id: string) {
    return this.pendingStudentsService.findById(id);
  }

  @Post(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Approve a student registration request' })
  async approve(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() dto: ReviewStudentDto,
  ) {
    return this.pendingStudentsService.approve(id, user.id, dto.adminNotes);
  }

  @Post(':id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Reject a student registration request' })
  async reject(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() dto: ReviewStudentDto,
  ) {
    return this.pendingStudentsService.reject(id, user.id, dto.adminNotes);
  }
}
