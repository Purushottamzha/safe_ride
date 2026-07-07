import { Controller, Get, Put, Body, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { NotificationPreferencesService } from './notification-preferences.service';
import { NotificationChannel } from '@prisma/client';

class UpdatePreferenceDto {
  eventType!: string;
  channel!: NotificationChannel;
  enabled!: boolean;
}

class BulkUpdateDto {
  preferences!: UpdatePreferenceDto[];
}

@Controller('notification-preferences')
@UseGuards(JwtAuthGuard)
export class NotificationPreferencesController {
  constructor(private service: NotificationPreferencesService) {}

  @Get()
  async getPreferences(@Req() req: any) {
    return this.service.findByUser(req.user.id);
  }

  @Put()
  async updatePreferences(@Req() req: any, @Body() dto: BulkUpdateDto) {
    return this.service.bulkUpdate(req.user.id, dto.preferences);
  }
}
