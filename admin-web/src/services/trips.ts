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
  search?: string;
}

export interface CreateTripPayload {
  busId: string;
  routeId: string;
  driverId: string;
  scheduledAt: string;
  type: 'MORNING' | 'AFTERNOON';
  schoolId: string;
  notes?: string;
  assignmentId?: string;
}

export interface UpdateTripPayload {
  busId?: string;
  routeId?: string;
  driverId?: string;
  scheduledAt?: string;
  type?: 'MORNING' | 'AFTERNOON';
  notes?: string;
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

  create: async (data: CreateTripPayload): Promise<Trip> => {
    const response = await api.post<Trip>('/trips', data);
    return response.data;
  },

  update: async (id: string, data: UpdateTripPayload): Promise<Trip> => {
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

  cancelTrip: async (id: string, reason?: string): Promise<Trip> => {
    const response = await api.post<Trip>(`/trips/${id}/cancel`, { reason });
    return response.data;
  },

  getReplay: async (id: string): Promise<any> => {
    const response = await api.get<any>(`/trips/${id}/replay`);
    return response.data;
  },

  getCalendar: async (params: { startDate: string; endDate: string; schoolId?: string; type?: string }): Promise<any> => {
    const response = await api.get<any>('/trips/calendar/data', { params });
    return response.data;
  },

  checkConflicts: async (body: { scheduledAt: string; type: string; driverId?: string; busId?: string; excludeTripId?: string }): Promise<{ hasConflicts: boolean; conflicts: any[] }> => {
    const response = await api.post<any>('/trips/check-conflicts', body);
    return response.data;
  },
};
