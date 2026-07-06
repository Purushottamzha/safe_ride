import api from './api';
import type { School, PaginatedResponse } from '../types';

export interface SchoolFilters {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

export const schoolService = {
  list: async (filters?: SchoolFilters): Promise<PaginatedResponse<School>> => {
    const response = await api.get<PaginatedResponse<School>>('/schools', { params: filters });
    return response.data;
  },

  getById: async (id: string): Promise<School> => {
    const response = await api.get<School>(`/schools/${id}`);
    return response.data;
  },

  create: async (data: Omit<School, 'id' | 'createdAt' | 'updatedAt' | 'isActive'> & { isActive?: boolean }): Promise<School> => {
    const response = await api.post<School>('/schools', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Omit<School, 'id' | 'createdAt' | 'updatedAt'>>): Promise<School> => {
    const response = await api.put<School>(`/schools/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/schools/${id}`);
  },
};
