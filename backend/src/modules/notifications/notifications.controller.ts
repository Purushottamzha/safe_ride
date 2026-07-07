import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { NotificationType, NotificationChannel } from '@prisma/client';
import { Request } from 'express';

@ApiTags('Notifications')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'DRIVER', 'PARENT')
  @ApiOperation({ summary: 'List notifications (users see their own)' })
  async findAll(
    @Req() req: Request,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('isRead') isRead?: string,
    @Query('type') type?: NotificationType,
  ) {
    const user = (req as any).user;
    const userId = user.role === 'SUPER_ADMIN' ? undefined : user.id;
    return this.notificationsService.findAll({
      page,
      limit,
      userId,
      isRead: isRead !== undefined ? isRead === 'true' : undefined,
      type,
    });
  }

  @Get('unread-count')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'DRIVER', 'PARENT')
  @ApiOperation({ summary: 'Get unread notification count' })
  async getUnreadCount(@Req() req: Request) {
    return this.notificationsService.getUnreadCount((req as any).user.id);
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'DRIVER', 'PARENT')
  @ApiOperation({ summary: 'Get notification by ID' })
  async findById(@Param('id') id: string) {
    return this.notificationsService.findById(id);
  }

  @Post()
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Create a notification' })
  async create(
    @Body()
    data: {
      type: NotificationType;
      channel: NotificationChannel;
      title: string;
      body: string;
      data?: Record<string, unknown>;
      userId?: string;
      schoolId?: string;
    },
  ) {
    return this.notificationsService.create(data);
  }

  @Put(':id/read')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'DRIVER', 'PARENT')
  @ApiOperation({ summary: 'Mark notification as read' })
  async markAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }

  @Put('mark-all-read')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'DRIVER', 'PARENT')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllAsRead(@Req() req: Request) {
    return this.notificationsService.markAllAsRead((req as any).user.id);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'DRIVER', 'PARENT')
  @ApiOperation({ summary: 'Delete notification' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.notificationsService.softDelete(id);
  }
}
