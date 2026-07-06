import api from './api';
import type { User, PaginatedResponse } from '../types';

export interface UserFilters {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  schoolId?: string;
}

export const userService = {
  list: async (filters?: UserFilters): Promise<PaginatedResponse<User>> => {
    const response = await api.get<PaginatedResponse<User>>('/users', { params: filters });
    return response.data;
  },

  getById: async (id: string): Promise<User> => {
    const response = await api.get<User>(`/users/${id}`);
    return response.data;
  },

  create: async (data: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'school'>): Promise<User> => {
    const response = await api.post<User>('/users', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'school'>>): Promise<User> => {
    const response = await api.put<User>(`/users/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`);
  },
};
