export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'SUPER_ADMIN' | 'SCHOOL_ADMIN' | 'DRIVER' | 'PARENT';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'LOCKED';
  schoolId?: string;
  school?: School;
  profilePicture?: string;
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
  firstName: string;
  lastName: string;
  role?: 'SUPER_ADMIN' | 'SCHOOL_ADMIN' | 'DRIVER' | 'PARENT';
  schoolId?: string;
  phone?: string;
}

export interface School {
  id: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  email: string;
  timezone: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  studentId: string;
  grade: string;
  section?: string;
  dateOfBirth: string;
  qrToken?: string;
  qrExpiresAt?: string;
  qrCode?: string;
  profilePicture?: string;
  address: string;
  phone?: string;
  isActive: boolean;
  schoolId: string;
  school?: School;
  emergencyNotes?: string;
  parentStudents?: StudentParent[];
  studentAssignments?: StudentAssignment[];
  createdAt: string;
  updatedAt: string;
}

export interface StudentParent {
  studentId: string;
  parentId: string;
  isPrimary: boolean;
  relation: string;
  parent: Parent;
  createdAt: string;
}

export interface Parent {
  id: string;
  userId: string;
  user: User;
  emergencyContact: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Driver {
  id: string;
  userId: string;
  user: User;
  licenseNumber: string;
  licenseExpiry: string;
  isAvailable: boolean;
  emergencyContact?: string;
  medicalNotes?: string;
  schoolId: string;
  school?: School;
  createdAt: string;
  updatedAt: string;
}

export interface Bus {
  id: string;
  plateNumber: string;
  busNumber: string;
  model?: string;
  capacity: number;
  year?: number;
  color?: string;
  status: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE' | 'RETIRED';
  gpsDeviceId?: string;
  cameraDeviceId?: string;
  lastGpsLat?: number;
  lastGpsLng?: number;
  lastGpsUpdate?: string;
  schoolId: string;
  school?: School;
  createdAt: string;
  updatedAt: string;
}

export interface Route {
  id: string;
  name: string;
  code: string;
  direction?: string;
  distance?: number;
  duration?: number;
  isActive: boolean;
  schoolId: string;
  school?: School;
  stops?: Stop[];
  createdAt: string;
  updatedAt: string;
}

export interface Stop {
  id: string;
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  isActive: boolean;
  schoolId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Trip {
  id: string;
  type: 'MORNING' | 'AFTERNOON';
  status: 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  scheduledAt: string;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  notes?: string;
  driverId?: string;
  driver?: { id: string; firstName: string; lastName: string; email: string; phone?: string };
  busId?: string;
  bus?: { id: string; plateNumber: string; busNumber: string; capacity: number; model?: string };
  routeId?: string;
  route?: { id: string; name: string; code: string; direction?: string };
  assignmentId?: string;
  schoolId: string;
  school?: School;
  tripEvents?: TripEvent[];
  attendance?: Attendance[];
  _count?: { tripEvents: number; attendance: number };
  createdAt: string;
  updatedAt: string;
}

export interface TripEvent {
  id: string;
  tripId: string;
  studentId?: string;
  student?: Student;
  scanType: 'BOARD_IN' | 'EXIT_OUT';
  latitude?: number;
  longitude?: number;
  speed?: number;
  heading?: number;
  createdAt: string;
}

export interface Attendance {
  id: string;
  studentId: string;
  student?: Student;
  tripId?: string;
  trip?: { id: string; type: string; status: string; scheduledAt: string };
  schoolId: string;
  school?: School;
  date: string;
  type: 'MORNING' | 'AFTERNOON';
  boardTime?: string;
  exitTime?: string;
  status: 'NOT_BOARDED' | 'BOARDED' | 'DROPPED' | 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  isLate: boolean;
  lateMinutes: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  type: 'ATTENDANCE' | 'TRIP_UPDATE' | 'INCIDENT' | 'EMERGENCY' | 'SYSTEM';
  channel: string;
  title: string;
  body: string;
  data?: any;
  userId?: string;
  schoolId?: string;
  isRead: boolean;
  readAt?: string;
  sentAt?: string;
  createdAt: string;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'REPORTED' | 'INVESTIGATING' | 'RESOLVED' | 'CLOSED';
  latitude?: number;
  longitude?: number;
  location?: string;
  reportedById: string;
  reportedBy: User;
  tripId?: string;
  studentId?: string;
  busId?: string;
  imageUrls: string[];
  resolution?: string;
  resolvedAt?: string;
  resolvedById?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Assignment {
  id: string;
  name?: string;
  schoolId: string;
  school?: School;
  routeId: string;
  route?: Route;
  isActive: boolean;
  driverAssignments?: DriverAssignment[];
  busAssignments?: BusAssignment[];
  studentAssignments?: StudentAssignment[];
  _count?: { driverAssignments: number; busAssignments: number; studentAssignments: number };
  createdAt: string;
  updatedAt: string;
}

export interface DriverAssignment {
  id: string;
  assignmentId: string;
  driverId: string;
  driver: Driver;
  isPrimary: boolean;
}

export interface BusAssignment {
  id: string;
  assignmentId: string;
  busId: string;
  bus: Bus;
  isPrimary: boolean;
}

export interface StudentAssignment {
  id: string;
  assignmentId: string;
  assignment?: Assignment;
  studentId: string;
  student: Student;
  stopId?: string;
  stop?: Stop;
  isActive: boolean;
}

export interface DashboardStats {
  totalStudents: number;
  totalDrivers: number;
  totalBuses: number;
  activeBuses: number;
  activeTrips: number;
  todayAttendance: { present: number; absent: number; late: number; total: number };
  pendingIncidents: number;
  weeklyAttendance?: { date: string; present: number; absent: number; late: number }[];
  recentTrips?: { id: string; date: string; type: string; status: string; driverName: string; busPlate: string }[];
  recentActivity?: any[];
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface ApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}
