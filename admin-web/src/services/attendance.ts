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

  getToday: async (studentId?: string): Promise<Attendance[]> => {
    const response = await api.get<Attendance[]>('/attendance/today', { params: { studentId } });
    return response.data;
  },

  getMonthly: async (year: number, month: number, studentId?: string, schoolId?: string): Promise<any> => {
    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];
    const response = await api.get<any>(`/attendance/range/${schoolId || ''}`, { params: { startDate, endDate } });
    return response.data;
  },
};
