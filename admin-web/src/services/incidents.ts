import api from './api';
import type { Incident, PaginatedResponse } from '../types';

export interface IncidentFilters {
  page?: number;
  limit?: number;
  status?: string;
  severity?: string;
  schoolId?: string;
}

export const incidentService = {
  list: async (filters?: IncidentFilters): Promise<PaginatedResponse<Incident>> => {
    const response = await api.get<PaginatedResponse<Incident>>('/incidents', { params: filters });
    return response.data;
  },

  getById: async (id: string): Promise<Incident> => {
    const response = await api.get<Incident>(`/incidents/${id}`);
    return response.data;
  },

  create: async (data: Omit<Incident, 'id' | 'createdAt' | 'updatedAt' | 'school' | 'reporter' | 'trip' | 'student'>): Promise<Incident> => {
    const response = await api.post<Incident>('/incidents', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Omit<Incident, 'id' | 'createdAt' | 'updatedAt' | 'school' | 'reporter' | 'trip' | 'student'>>): Promise<Incident> => {
    const response = await api.put<Incident>(`/incidents/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/incidents/${id}`);
  },

  resolve: async (id: string, resolution: string): Promise<Incident> => {
    const response = await api.post<Incident>(`/incidents/${id}/resolve`, { resolution });
    return response.data;
  },
};
