export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
  path: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    data: T[];
    meta: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  };
  timestamp: string;
  path: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    schoolId: string | null;
  };
  tokens: AuthTokens;
}

export interface UserProfile {
  id: string;
  email: string;
  phone: string | null;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  isEmailVerified: boolean;
  isMfaEnabled: boolean;
  profilePicture: string | null;
  lastLoginAt: string | null;
  schoolId: string | null;
  school?: { id: string; name: string; code: string } | null;
  createdAt: string;
}

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  grade: string;
  section: string | null;
  studentId: string;
  isActive: boolean;
  profilePicture: string | null;
  address: string;
  phone: string | null;
  schoolId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Trip {
  id: string;
  type: 'MORNING' | 'AFTERNOON';
  status: 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  scheduledAt: string;
  startedAt: string | null;
  completedAt: string | null;
  driverId: string | null;
  busId: string | null;
  routeId: string | null;
  schoolId: string;
  notes: string | null;
  createdAt: string;
}

export interface Attendance {
  id: string;
  studentId: string;
  tripId: string | null;
  schoolId: string;
  date: string;
  type: 'MORNING' | 'AFTERNOON';
  boardTime: string | null;
  exitTime: string | null;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  isLate: boolean;
  lateMinutes: number;
  notes: string | null;
}

export interface TripEvent {
  id: string;
  tripId: string;
  studentId: string | null;
  scanType: 'BOARD_IN' | 'EXIT_OUT';
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export interface DashboardStats {
  totalStudents: number;
  totalDrivers: number;
  totalBuses: number;
  activeTrips: number;
  todayAttendance: number;
  pendingIncidents: number;
  recentActivity: TripEvent[];
}
