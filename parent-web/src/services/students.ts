import api from './api';
import type { Student } from '@/types';

export const getMyChildren = async (): Promise<Student[]> => {
  const { data } = await api.get<Student[]>('/parents/me/children');
  return data;
};

export const getStudentById = async (id: string): Promise<Student> => {
  const { data } = await api.get<Student>(`/students/${id}`);
  return data;
};
