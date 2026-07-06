import api from './api';
import type { Attendance, TodayStatus, PaginatedResponse } from '@/types';

interface AttendanceParams {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}

export const getStudentAttendance = async (
  studentId: string,
  params?: AttendanceParams,
): Promise<PaginatedResponse<Attendance>> => {
  const { data } = await api.get<PaginatedResponse<Attendance>>('/attendance', {
    params: { studentId, ...params },
  });
  return data;
};

export const getTodayStatus = async (studentId: string): Promise<TodayStatus> => {
  const { data } = await api.get<TodayStatus>('/attendance/today', {
    params: { studentId },
  });
  return data;
};
