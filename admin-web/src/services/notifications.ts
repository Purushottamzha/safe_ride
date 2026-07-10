import api from './api';
import type { Notification, PaginatedResponse } from '../types';

export interface NotificationFilters {
  page?: number;
  limit?: number;
  isRead?: boolean;
}

export const notificationService = {
  list: async (filters?: NotificationFilters): Promise<PaginatedResponse<Notification>> => {
    const response = await api.get<PaginatedResponse<Notification>>('/notifications', { params: filters });
    return response.data;
  },

  markRead: async (id: string): Promise<Notification> => {
    const response = await api.put<Notification>(`/notifications/${id}/read`);
    return response.data;
  },

  markAllRead: async (): Promise<void> => {
    await api.put('/notifications/mark-all-read');
  },

  getUnreadCount: async (): Promise<{ count: number }> => {
    const response = await api.get<{ count: number }>('/notifications/unread-count');
    return response.data;
  },
};
