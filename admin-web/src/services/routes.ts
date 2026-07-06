import api from './api';
import type { Route, PaginatedResponse } from '../types';

export interface RouteFilters {
  page?: number;
  limit?: number;
  schoolId?: string;
}

export const routeService = {
  list: async (filters?: RouteFilters): Promise<PaginatedResponse<Route>> => {
    const response = await api.get<PaginatedResponse<Route>>('/routes', { params: filters });
    return response.data;
  },

  getById: async (id: string): Promise<Route> => {
    const response = await api.get<Route>(`/routes/${id}`);
    return response.data;
  },

  create: async (data: Omit<Route, 'id' | 'createdAt' | 'updatedAt' | 'school' | 'stops'>): Promise<Route> => {
    const response = await api.post<Route>('/routes', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Omit<Route, 'id' | 'createdAt' | 'updatedAt' | 'school' | 'stops'>>): Promise<Route> => {
    const response = await api.put<Route>(`/routes/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/routes/${id}`);
  },
};
