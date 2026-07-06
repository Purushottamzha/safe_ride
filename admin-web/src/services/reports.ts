import api from './api';
import type { ReportData } from '../types';

export interface AttendanceReportFilters {
  startDate: string;
  endDate: string;
  schoolId?: string;
  grade?: string;
  section?: string;
}

export interface DriverPerformanceFilters {
  startDate: string;
  endDate: string;
  driverId?: string;
  schoolId?: string;
}

export const reportService = {
  getAttendanceReport: async (filters: AttendanceReportFilters): Promise<ReportData> => {
    const response = await api.get<ReportData>('/reports/attendance', { params: filters });
    return response.data;
  },

  getDriverPerformance: async (filters: DriverPerformanceFilters): Promise<ReportData> => {
    const response = await api.get<ReportData>('/reports/driver-performance', { params: filters });
    return response.data;
  },
};
