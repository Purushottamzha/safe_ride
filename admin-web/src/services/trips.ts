import api from './api';
import type { Trip, PaginatedResponse } from '../types';

export interface TripFilters {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
  date?: string;
  schoolId?: string;
  driverId?: string;
  busId?: string;
}

export const tripService = {
  list: async (filters?: TripFilters): Promise<PaginatedResponse<Trip>> => {
    const response = await api.get<PaginatedResponse<Trip>>('/trips', { params: filters });
    return response.data;
  },

  getById: async (id: string): Promise<Trip> => {
    const response = await api.get<Trip>(`/trips/${id}`);
    return response.data;
  },

  create: async (data: {
    busId: string;
    routeId: string;
    driverId: string;
    date: string;
    type: 'morning' | 'evening';
    schoolId: string;
  }): Promise<Trip> => {
    const response = await api.post<Trip>('/trips', data);
    return response.data;
  },

  update: async (id: string, data: Partial<{
    busId: string;
    routeId: string;
    driverId: string;
    date: string;
    type: 'morning' | 'evening';
  }>): Promise<Trip> => {
    const response = await api.put<Trip>(`/trips/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/trips/${id}`);
  },

  startTrip: async (id: string): Promise<Trip> => {
    const response = await api.post<Trip>(`/trips/${id}/start`);
    return response.data;
  },

  completeTrip: async (id: string): Promise<Trip> => {
    const response = await api.post<Trip>(`/trips/${id}/complete`);
    return response.data;
  },

  cancelTrip: async (id: string): Promise<Trip> => {
    const response = await api.post<Trip>(`/trips/${id}/cancel`);
    return response.data;
  },
};
