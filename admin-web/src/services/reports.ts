import api from './api';

export interface DateRangeFilter {
  startDate: string;
  endDate: string;
  schoolId?: string;
}

export interface AttendanceReportEntry {
  date: string;
  present: number;
  absent: number;
  late: number;
  excused: number;
  total: number;
}

export interface MonthlyAttendanceEntry {
  month: string;
  present: number;
  absent: number;
  late: number;
  total: number;
  attendanceRate: number;
}

export interface DriverPerformanceEntry {
  driverId: string;
  driverName: string;
  totalTrips: number;
  onTimeTrips: number;
  lateTrips: number;
  cancelledTrips: number;
  onTimeRate: number;
  averageTripDuration: number;
  totalStudentsTransported: number;
}

export interface BusUtilizationEntry {
  busId: string;
  plateNumber: string;
  busNumber: string;
  totalTrips: number;
  totalStudents: number;
  capacity: number;
  utilizationRate: number;
  totalDistance?: number;
  activeDays: number;
}

export interface AttendanceReportResponse {
  daily: AttendanceReportEntry[];
  summary: {
    totalPresent: number;
    totalAbsent: number;
    totalLate: number;
    averageAttendanceRate: number;
  };
}

export interface MonthlyAttendanceResponse {
  monthly: MonthlyAttendanceEntry[];
  summary: {
    averageRate: number;
    bestMonth: string;
    worstMonth: string;
  };
}

export interface DriverPerformanceResponse {
  drivers: DriverPerformanceEntry[];
  summary: {
    averageOnTimeRate: number;
    bestDriver: string;
    worstDriver: string;
  };
}

export interface BusUtilizationResponse {
  buses: BusUtilizationEntry[];
  summary: {
    averageUtilization: number;
    totalTrips: number;
    totalStudents: number;
  };
}

export const reportService = {
  getDailyAttendance: async (filters: DateRangeFilter): Promise<AttendanceReportResponse> => {
    const response = await api.get<AttendanceReportResponse>('/reports/attendance/daily', { params: filters });
    return response.data;
  },

  getMonthlyAttendance: async (filters: DateRangeFilter): Promise<MonthlyAttendanceResponse> => {
    const response = await api.get<MonthlyAttendanceResponse>('/reports/attendance/monthly', { params: filters });
    return response.data;
  },

  getDriverPerformance: async (filters: DateRangeFilter & { driverId?: string }): Promise<DriverPerformanceResponse> => {
    const response = await api.get<DriverPerformanceResponse>('/reports/driver-performance', { params: filters });
    return response.data;
  },

  getBusUtilization: async (filters: DateRangeFilter & { busId?: string }): Promise<BusUtilizationResponse> => {
    const response = await api.get<BusUtilizationResponse>('/reports/bus-utilization', { params: filters });
    return response.data;
  },
};
