import api from './api';
import type { Parent, PaginatedResponse } from '../types';

export interface ParentFilters {
  page?: number;
  limit?: number;
  search?: string;
  schoolId?: string;
}

export interface CreateParentPayload {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  emergencyContact?: boolean;
  schoolId: string;
}

export interface UpdateParentPayload {
  firstName?: string;
  lastName?: string;
  phone?: string;
  emergencyContact?: boolean;
}

export const parentService = {
  list: async (filters?: ParentFilters): Promise<PaginatedResponse<Parent>> => {
    const response = await api.get<PaginatedResponse<Parent>>('/parents', { params: filters });
    return response.data;
  },

  getById: async (id: string): Promise<Parent> => {
    const response = await api.get<Parent>(`/parents/${id}`);
    return response.data;
  },

  create: async (data: CreateParentPayload): Promise<Parent> => {
    const response = await api.post<Parent>('/parents', data);
    return response.data;
  },

  update: async (id: string, data: UpdateParentPayload): Promise<Parent> => {
    const response = await api.put<Parent>(`/parents/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/parents/${id}`);
  },
};
