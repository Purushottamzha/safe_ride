import api from './api';

export interface OverviewStats {
  totalStudents: number;
  activeDrivers: number;
  activeBuses: number;
  activeTrips: number;
  todayStats: {
    totalAttendance: number;
    present: number;
    absent: number;
    attendanceRate: number;
  };
  trips: {
    total: number;
    completed: number;
    delayed: number;
    onTimeRate: number;
  };
  fleetUtilization: number;
  safetyScore: number;
  pendingIncidents: number;
}

export interface AttendanceTrend {
  date: string;
  present: number;
  absent: number;
  late: number;
  total: number;
  rate: number;
}

export interface DriverRanking {
  id: string;
  driverId: string;
  overallScore: number;
  tripCount: number;
  completedTrips: number;
  driver: { id: string; firstName: string; lastName: string; profilePicture?: string };
}

export interface DelayMetric {
  routeId: string;
  routeName: string;
  stopCount: number;
  tripCount: number;
  avgDelay: number;
  maxDelay: number;
  onTimeRate: number;
}

export interface FleetUtilization {
  busId: string;
  busNumber: string;
  plateNumber: string;
  capacity: number;
  completedTrips: number;
  utilization: number;
}

export const analyticsService = {
  getOverview: async (schoolId?: string): Promise<OverviewStats> => {
    const { data } = await api.get<OverviewStats>('/analytics/overview', { params: { schoolId } });
    return data;
  },

  getAttendanceTrends: async (schoolId?: string, days = 30): Promise<AttendanceTrend[]> => {
    const { data } = await api.get<AttendanceTrend[]>('/analytics/attendance-trends', { params: { schoolId, days } });
    return data;
  },

  getDriverRanking: async (schoolId?: string): Promise<DriverRanking[]> => {
    const { data } = await api.get<DriverRanking[]>('/analytics/driver-ranking', { params: { schoolId } });
    return data;
  },

  getDelayMetrics: async (schoolId?: string): Promise<DelayMetric[]> => {
    const { data } = await api.get<DelayMetric[]>('/analytics/delay-metrics', { params: { schoolId } });
    return data;
  },

  getFleetUtilization: async (schoolId?: string): Promise<FleetUtilization[]> => {
    const { data } = await api.get<FleetUtilization[]>('/analytics/fleet-utilization', { params: { schoolId } });
    return data;
  },
};
