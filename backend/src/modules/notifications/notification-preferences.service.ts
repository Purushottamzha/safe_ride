import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { NotificationChannel } from '@prisma/client';

@Injectable()
export class NotificationPreferencesService {
  constructor(private prisma: PrismaService) {}

  async findByUser(userId: string) {
    return this.prisma.notificationPreference.findMany({
      where: { userId },
      orderBy: { eventType: 'asc' },
    });
  }

  async upsert(data: {
    userId: string;
    eventType: string;
    channel: NotificationChannel;
    enabled: boolean;
  }) {
    return this.prisma.notificationPreference.upsert({
      where: {
        userId_eventType_channel: {
          userId: data.userId,
          eventType: data.eventType as any,
          channel: data.channel,
        },
      },
      update: { enabled: data.enabled },
      create: {
        userId: data.userId,
        eventType: data.eventType as any,
        channel: data.channel,
        enabled: data.enabled,
      },
    });
  }

  async bulkUpdate(userId: string, preferences: Array<{
    eventType: string;
    channel: NotificationChannel;
    enabled: boolean;
  }>) {
    const results = [];
    for (const pref of preferences) {
      results.push(await this.upsert({ userId, ...pref }));
    }
    return results;
  }

  async isEventEnabled(userId: string, eventType: string): Promise<boolean> {
    const prefs = await this.prisma.notificationPreference.findMany({
      where: { userId, eventType: eventType as any, enabled: true },
    });
    return prefs.length > 0;
  }

  async getEnabledUsersForEvent(
    userIds: string[],
    eventType: string,
  ): Promise<string[]> {
    if (userIds.length === 0) return [];

    const prefs = await this.prisma.notificationPreference.findMany({
      where: {
        userId: { in: userIds },
        eventType: eventType as any,
        enabled: true,
      },
      select: { userId: true },
    });
    return prefs.map(p => p.userId);
  }
}
