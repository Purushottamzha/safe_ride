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
    section: c.section || undefined,
    studentId: c.studentId,
    school: c.school,
    schoolId: c.schoolId,
    photoUrl: c.photoUrl || undefined,
    todayStatus: c.todayStatus,
    bus: c.bus,
    driver: c.driver,
    route: c.route,
    stop: c.stop,
  }));
};

export const getStudentById = async (id: string): Promise<Student> => {
  const { data } = await api.get(`/students/${id}`);
  const activeAssignment = data.studentAssignments?.find((sa: any) => sa.isActive)?.assignment;
  const primaryDriverAssign = activeAssignment?.driverAssignments?.find((da: any) => da.isPrimary)?.driver;
  const primaryBusAssign = activeAssignment?.busAssignments?.find((ba: any) => ba.isPrimary)?.bus;
  const studentStop = data.studentAssignments?.find((sa: any) => sa.isActive)?.stop;
  return {
    id: data.id,
    name: `${data.firstName} ${data.lastName}`,
    grade: data.grade,
    section: data.section || undefined,
    studentId: data.studentId,
    school: data.school?.name || '',
    schoolId: data.schoolId,
    photoUrl: data.profilePicture || undefined,
    bloodGroup: data.bloodGroup,
    emergencyContact: data.phone,
    medicalNotes: data.emergencyNotes,
    driver: primaryDriverAssign ? {
      id: primaryDriverAssign.id,
      name: `${primaryDriverAssign.user?.firstName || ''} ${primaryDriverAssign.user?.lastName || ''}`.trim(),
      phone: primaryDriverAssign.user?.phone,
      email: primaryDriverAssign.user?.email,
      licenseNumber: primaryDriverAssign.licenseNumber,
      emergencyContact: primaryDriverAssign.emergencyContact,
    } : data.driver ? {
      id: data.driver.id,
      name: data.driver.name || `${data.driver.firstName || ''} ${data.driver.lastName || ''}`.trim(),
      phone: data.driver.phone || data.driver.user?.phone,
      email: data.driver.email || data.driver.user?.email,
      licenseNumber: data.driver.licenseNumber,
      emergencyContact: data.driver.emergencyContact,
    } : null,
    bus: primaryBusAssign ? {
      id: primaryBusAssign.id,
      busNumber: primaryBusAssign.busNumber,
      plateNumber: primaryBusAssign.plateNumber,
      model: primaryBusAssign.model,
      color: primaryBusAssign.color,
      status: primaryBusAssign.status,
    } : data.bus ? {
      id: data.bus.id,
      busNumber: data.bus.busNumber,
      plateNumber: data.bus.plateNumber,
      model: data.bus.model,
      color: data.bus.color,
      status: data.bus.status,
    } : null,
    route: activeAssignment?.route ? { id: activeAssignment.route.id, name: activeAssignment.route.name } : data.route || null,
    stop: studentStop ? { id: studentStop.id, name: studentStop.name, address: studentStop.address } : data.stop || null,
  };
};
