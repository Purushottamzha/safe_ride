import api from './api';
import { Incident } from '../types';

export interface CreateIncidentData {
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  location?: string;
  tripId?: string;
}

export const createIncident = async (data: CreateIncidentData): Promise<Incident> => {
  const response = await api.post<Incident>('/api/v1/incidents', data);
  return response.data;
};

export const getIncidents = async (tripId?: string): Promise<Incident[]> => {
  const params = tripId ? { tripId } : {};
  const response = await api.get<Incident[]>('/api/v1/incidents', { params });
  return response.data;
};
