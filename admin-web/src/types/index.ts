export interface User {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'school_admin' | 'driver' | 'attendant';
  schoolId?: string;
  school?: School;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: User['role'];
  schoolId?: string;
}

export interface School {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  grade: string;
  section: string;
  qrCode: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  address: string;
  schoolId: string;
  school?: School;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  licenseNumber: string;
  schoolId: string;
  school?: School;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Bus {
  id: string;
  plateNumber: string;
  model: string;
  capacity: number;
  schoolId: string;
  school?: School;
  driverId?: string;
  driver?: Driver;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Route {
  id: string;
  name: string;
  description?: string;
  schoolId: string;
  school?: School;
  stops: Stop[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Stop {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  routeId: string;
  route?: Route;
  order: number;
  estimatedArrival?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TripStatus {
  id: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  busId: string;
  bus?: Bus;
  routeId: string;
  route?: Route;
  driverId: string;
  driver?: Driver;
  date: string;
  type: 'morning' | 'evening';
  startTime?: string;
  endTime?: string;
  schoolId: string;
  school?: School;
  createdAt: string;
  updatedAt: string;
}

export interface Trip extends TripStatus {
  attendance: Attendance[];
}

export interface Attendance {
  id: string;
  studentId: string;
  student?: Student;
  tripId: string;
  trip?: TripStatus;
  status: 'present' | 'absent' | 'late' | 'excused';
  scanTime?: string;
  scannedBy?: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  isRead: boolean;
  userId: string;
  createdAt: string;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  tripId?: string;
  trip?: TripStatus;
  studentId?: string;
  student?: Student;
  reportedBy: string;
  reporter?: User;
  resolvedAt?: string;
  resolvedBy?: string;
  resolution?: string;
  schoolId: string;
  school?: School;
  createdAt: string;
  updatedAt: string;
}

export interface Assignment {
  id: string;
  studentId: string;
  student?: Student;
  busId: string;
  bus?: Bus;
  routeId: string;
  route?: Route;
  stopId: string;
  stop?: Stop;
  type: 'morning' | 'evening' | 'both';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalStudents: number;
  activeDrivers: number;
  totalBuses: number;
  activeTrips: number;
  todayAttendancePercent: number;
  pendingIncidents: number;
  weeklyAttendance: { date: string; present: number; absent: number; late: number }[];
  recentTrips: {
    id: string;
    date: string;
    type: string;
    status: string;
    driverName: string;
    busPlate: string;
  }[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}

export interface ReportData {
  [key: string]: unknown;
}
