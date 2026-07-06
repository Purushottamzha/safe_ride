import api from './api';
import type { Trip, TripEvent, PaginatedResponse } from '@/types';

interface TripParams {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}

export const getStudentTrips = async (
  studentId: string,
  params?: TripParams,
): Promise<PaginatedResponse<Trip>> => {
  const { data } = await api.get<PaginatedResponse<Trip>>('/trips', {
    params: { studentId, ...params },
  });
  return data;
};

export const getActiveTrip = async (studentId: string): Promise<Trip | null> => {
  const { data } = await api.get<Trip>('/trips/active', {
    params: { studentId },
  });
  return data;
};

export const getTripEvents = async (tripId: string): Promise<TripEvent[]> => {
  const { data } = await api.get<TripEvent[]>(`/trips/${tripId}/events`);
  return data;
};
