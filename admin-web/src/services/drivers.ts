import api from './api';
import type { Driver, PaginatedResponse } from '../types';

export interface DriverFilters {
  page?: number;
  limit?: number;
  search?: string;
  schoolId?: string;
}

export const driverService = {
  list: async (filters?: DriverFilters): Promise<PaginatedResponse<Driver>> => {
    const response = await api.get<PaginatedResponse<Driver>>('/drivers', { params: filters });
    return response.data;
  },

  getById: async (id: string): Promise<Driver> => {
    const response = await api.get<Driver>(`/drivers/${id}`);
    return response.data;
  },

  create: async (data: Omit<Driver, 'id' | 'createdAt' | 'updatedAt' | 'school' | 'isActive'> & { isActive?: boolean }): Promise<Driver> => {
    const response = await api.post<Driver>('/drivers', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Omit<Driver, 'id' | 'createdAt' | 'updatedAt' | 'school'>>): Promise<Driver> => {
    const response = await api.put<Driver>(`/drivers/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/drivers/${id}`);
  },
};
