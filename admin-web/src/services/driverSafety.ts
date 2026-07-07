import api from './api';

export interface DriverSafetyScore {
  id: string;
  driverId: string;
  driver: { id: string; firstName: string; lastName: string; email: string; schoolId?: string };
  overallScore: number;
  tripCount: number;
  totalDistance: number;
  overspeedCount: number;
  deviationCount: number;
  idleEventCount: number;
  missedStopCount: number;
  hardBrakeCount: number;
  gpsDropCount: number;
  emergencyCount: number;
  lastUpdated: string;
}

export interface DriverSafetyEvent {
  id: string;
  driverId: string;
  tripId?: string;
  trip?: { id: string; type: string; scheduledAt: string };
  eventType: string;
  description: string;
  severity: number;
  speed?: number;
  latitude?: number;
  longitude?: number;
  createdAt: string;
}

export const driverSafetyService = {
  getAllScores: async (schoolId?: string): Promise<DriverSafetyScore[]> => {
    const params = schoolId ? { schoolId } : {};
    const { data } = await api.get<DriverSafetyScore[]>('/driver-safety/scores', { params });
    return data;
  },
  getScore: async (driverId: string): Promise<DriverSafetyScore> => {
    const { data } = await api.get<DriverSafetyScore>(`/driver-safety/${driverId}`);
    return data;
  },
  getEvents: async (driverId: string, limit?: number): Promise<DriverSafetyEvent[]> => {
    const params = limit ? { limit: limit.toString() } : {};
    const { data } = await api.get<DriverSafetyEvent[]>(`/driver-safety/${driverId}/events`, { params });
    return data;
  },
};
