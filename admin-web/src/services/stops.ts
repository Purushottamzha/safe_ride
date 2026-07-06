import api from './api';
import type { Stop, PaginatedResponse } from '../types';

export interface StopFilters {
  page?: number;
  limit?: number;
  routeId?: string;
}

export const stopService = {
  list: async (filters?: StopFilters): Promise<PaginatedResponse<Stop>> => {
    const response = await api.get<PaginatedResponse<Stop>>('/stops', { params: filters });
    return response.data;
  },

  getById: async (id: string): Promise<Stop> => {
    const response = await api.get<Stop>(`/stops/${id}`);
    return response.data;
  },

  create: async (data: Omit<Stop, 'id' | 'createdAt' | 'updatedAt' | 'route'>): Promise<Stop> => {
    const response = await api.post<Stop>('/stops', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Omit<Stop, 'id' | 'createdAt' | 'updatedAt' | 'route'>>): Promise<Stop> => {
    const response = await api.put<Stop>(`/stops/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/stops/${id}`);
  },
};
