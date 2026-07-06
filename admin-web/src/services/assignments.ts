import api from './api';
import type { Assignment, PaginatedResponse } from '../types';

export interface AssignmentFilters {
  page?: number;
  limit?: number;
  studentId?: string;
  busId?: string;
  routeId?: string;
  schoolId?: string;
  type?: string;
}

export const assignmentService = {
  list: async (filters?: AssignmentFilters): Promise<PaginatedResponse<Assignment>> => {
    const response = await api.get<PaginatedResponse<Assignment>>('/assignments', { params: filters });
    return response.data;
  },

  getById: async (id: string): Promise<Assignment> => {
    const response = await api.get<Assignment>(`/assignments/${id}`);
    return response.data;
  },

  create: async (data: Omit<Assignment, 'id' | 'createdAt' | 'updatedAt' | 'student' | 'bus' | 'route' | 'stop'>): Promise<Assignment> => {
    const response = await api.post<Assignment>('/assignments', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Omit<Assignment, 'id' | 'createdAt' | 'updatedAt' | 'student' | 'bus' | 'route' | 'stop'>>): Promise<Assignment> => {
    const response = await api.put<Assignment>(`/assignments/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/assignments/${id}`);
  },
};
