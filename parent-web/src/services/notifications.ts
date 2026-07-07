import api from './api';
import type { Notification, PaginatedResponse, UnreadCount } from '@/types';

interface NotificationParams {
  page?: number;
  limit?: number;
}

export const getNotifications = async (
  params?: NotificationParams,
): Promise<PaginatedResponse<Notification>> => {
  const { data } = await api.get<PaginatedResponse<Notification>>('/notifications', {
    params,
  });
  return data;
};

export const markAsRead = async (id: string): Promise<void> => {
  await api.put(`/notifications/${id}/read`);
};

export const getUnreadCount = async (): Promise<UnreadCount> => {
  const { data } = await api.get<UnreadCount>('/notifications/unread-count');
  return data;
};

export interface NotificationPreference {
  id: string;
  userId: string;
  eventType: string;
  channel: string;
  enabled: boolean;
}

export const notificationPreferenceService = {
  get: async (): Promise<NotificationPreference[]> => {
    const { data } = await api.get<NotificationPreference[]>('/notification-preferences');
    return data;
  },
  update: async (preferences: { eventType: string; channel: string; enabled: boolean }[]): Promise<NotificationPreference[]> => {
    const { data } = await api.put<NotificationPreference[]>('/notification-preferences', { preferences });
    return data;
  },
};
