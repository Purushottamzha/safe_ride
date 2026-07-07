import api from './api';
import type { Bus, PaginatedResponse } from '../types';

export interface BusFilters {
  page?: number;
  limit?: number;
  search?: string;
  schoolId?: string;
  status?: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE' | 'RETIRED';
}

export interface CreateBusPayload {
  plateNumber: string;
  busNumber: string;
  model?: string;
  capacity: number;
  year?: number;
  color?: string;
  status?: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE' | 'RETIRED';
  gpsDeviceId?: string;
  cameraDeviceId?: string;
  schoolId: string;
}

export interface UpdateBusPayload {
  plateNumber?: string;
  busNumber?: string;
  model?: string;
  capacity?: number;
  year?: number;
  color?: string;
  status?: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE' | 'RETIRED';
  gpsDeviceId?: string;
  cameraDeviceId?: string;
}

export const busService = {
  list: async (filters?: BusFilters): Promise<PaginatedResponse<Bus>> => {
    const response = await api.get<PaginatedResponse<Bus>>('/buses', { params: filters });
    return response.data;
  },

  getById: async (id: string): Promise<Bus> => {
    const response = await api.get<Bus>(`/buses/${id}`);
    return response.data;
  },

  create: async (data: CreateBusPayload): Promise<Bus> => {
    const response = await api.post<Bus>('/buses', data);
    return response.data;
  },

  update: async (id: string, data: UpdateBusPayload): Promise<Bus> => {
    const response = await api.put<Bus>(`/buses/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/buses/${id}`);
  },
};
