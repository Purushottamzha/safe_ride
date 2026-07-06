import api from './api';
import type { Student, PaginatedResponse } from '../types';

export interface StudentFilters {
  page?: number;
  limit?: number;
  search?: string;
  grade?: string;
  section?: string;
  schoolId?: string;
}

export const studentService = {
  list: async (filters?: StudentFilters): Promise<PaginatedResponse<Student>> => {
    const response = await api.get<PaginatedResponse<Student>>('/students', { params: filters });
    return response.data;
  },

  getById: async (id: string): Promise<Student> => {
    const response = await api.get<Student>(`/students/${id}`);
    return response.data;
  },

  create: async (data: Omit<Student, 'id' | 'createdAt' | 'updatedAt' | 'school' | 'isActive' | 'qrCode'> & { isActive?: boolean; qrCode?: string }): Promise<Student> => {
    const response = await api.post<Student>('/students', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Omit<Student, 'id' | 'createdAt' | 'updatedAt' | 'school'>>): Promise<Student> => {
    const response = await api.put<Student>(`/students/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/students/${id}`);
  },

  regenerateQR: async (id: string): Promise<{ qrCode: string }> => {
    const response = await api.post<{ qrCode: string }>(`/students/${id}/regenerate-qr`);
    return response.data;
  },
};
