import api from './api';
import type { Attendance, PaginatedResponse } from '../types';

export interface AttendanceFilters {
  page?: number;
  limit?: number;
  date?: string;
  startDate?: string;
  endDate?: string;
  studentId?: string;
  tripId?: string;
  status?: string;
  schoolId?: string;
}

export const attendanceService = {
  list: async (filters?: AttendanceFilters): Promise<PaginatedResponse<Attendance>> => {
    const response = await api.get<PaginatedResponse<Attendance>>('/attendance', { params: filters });
    return response.data;
  },

  getByStudent: async (studentId: string, filters?: { startDate?: string; endDate?: string; limit?: number }): Promise<PaginatedResponse<Attendance>> => {
    const response = await api.get<PaginatedResponse<Attendance>>(`/attendance/student/${studentId}`, { params: filters });
    return response.data;
  },

  getToday: async (): Promise<Attendance[]> => {
    const response = await api.get<Attendance[]>('/attendance/today');
    return response.data;
  },

  getMonthly: async (year: number, month: number, studentId?: string): Promise<Attendance[]> => {
    const response = await api.get<Attendance[]>('/attendance/monthly', { params: { year, month, studentId } });
    return response.data;
  },
};
