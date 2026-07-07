import api from './api';
import type { Student, TodayStatus } from '@/types';

interface ChildRaw {
  id: string;
  name: string;
  grade: string;
  section: string | null;
  school: string;
  schoolId: string;
  photoUrl: string | null;
  studentId: string;
  todayStatus: TodayStatus;
  bus: {
    id: string;
    plateNumber: string;
    busNumber: string;
    model: string | null;
    color: string | null;
    status: string;
  } | null;
  driver: {
    id: string;
    name: string;
    phone: string | null;
    email: string;
  } | null;
  route: { id: string; name: string } | null;
  stop: { id: string; name: string; address: string } | null;
}

export const getMyChildren = async (): Promise<Student[]> => {
  const { data } = await api.get<ChildRaw[]>('/parents/me/children');
  return data.map((c) => ({
    id: c.id,
    name: c.name,
    grade: c.grade,
    school: c.school,
    photoUrl: c.photoUrl || undefined,
  }));
};

export const getStudentById = async (id: string): Promise<Student> => {
  const { data } = await api.get(`/students/${id}`);
  return {
    id: data.id,
    name: `${data.firstName} ${data.lastName}`,
    grade: data.grade,
    school: data.school?.name || '',
    photoUrl: data.profilePicture || undefined,
  };
};
