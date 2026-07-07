export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'parent';
}

export interface Student {
  id: string;
  name: string;
  grade: string;
  school: string;
  photoUrl?: string;
  rfidCardId?: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'no_school' | 'unknown';
export type TripDirection = 'TO_SCHOOL' | 'FROM_SCHOOL';
export type TripStatus = 'PENDING' | 'BOARDED' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED';

export interface Attendance {
  id: string;
  studentId: string;
  date: string;
  status: AttendanceStatus;
  boardTime?: string;
  exitTime?: string;
  isLate: boolean;
}

export interface TodayStatus {
  studentId: string;
  date: string;
  status: AttendanceStatus;
  currentTripStatus?: TripStatus;
  currentDirection?: TripDirection;
  lastScanTime?: string;
  lastScanLocation?: string;
  message: string;
}

export interface TripEvent {
  id: string;
  tripId: string;
  type: 'BOARD_IN' | 'BOARD_OUT' | 'EXIT_IN' | 'EXIT_OUT';
  timestamp: string;
  location: string;
  studentId: string;
}

export interface Trip {
  id: string;
  studentId: string;
  date: string;
  direction: TripDirection;
  status: TripStatus;
  busNumber?: string;
  driverName?: string;
  boardTime?: string;
  exitTime?: string;
  duration?: number;
  events: TripEvent[];
  routePoints?: [number, number][];
}

export type NotificationType = 'BOARDING' | 'ARRIVAL' | 'DEPARTURE' | 'ABSENT' | 'LATE' | 'SYSTEM';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  studentId?: string;
}

export interface NotificationPreference {
  id: string;
  userId: string;
  eventType: string;
  channel: string;
  enabled: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken?: string;
}

export interface UnreadCount {
  count: number;
}

export interface DashboardStats {
  totalStudents: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  unreadNotifications: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
