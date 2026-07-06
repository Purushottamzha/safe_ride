import api from './api';
import { Trip } from '../types';

export const getTodayTrips = async (): Promise<Trip[]> => {
  const response = await api.get<Trip[]>('/api/v1/trips', {
    params: { status: 'SCHEDULED,ACTIVE' },
  });
  return response.data;
};

export const getTripById = async (id: string): Promise<Trip> => {
  const response = await api.get<Trip>(`/api/v1/trips/${id}`);
  return response.data;
};

export const startTrip = async (id: string): Promise<Trip> => {
  const response = await api.post<Trip>(`/api/v1/trips/${id}/start`);
  return response.data;
};

export const completeTrip = async (id: string): Promise<Trip> => {
  const response = await api.post<Trip>(`/api/v1/trips/${id}/complete`);
  return response.data;
};

export const cancelTrip = async (id: string, reason: string): Promise<Trip> => {
  const response = await api.post<Trip>(`/api/v1/trips/${id}/cancel`, { reason });
  return response.data;
};
