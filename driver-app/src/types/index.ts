export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface Trip {
  id: string;
  type: 'MORNING' | 'AFTERNOON';
  status: 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  scheduledAt: string;
  startedAt: string | null;
  completedAt: string | null;
  busId: string | null;
  routeId: string | null;
  notes: string | null;
  bus?: { plateNumber: string; busNumber: string };
  route?: { name: string };
  _count?: { tripEvents: number; attendance: number };
}

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  grade: string;
  section: string | null;
  studentId: string;
  profilePicture: string | null;
}

export interface TripEvent {
  id: string;
  tripId: string;
  studentId: string;
  scanType: 'BOARD_IN' | 'EXIT_OUT';
  createdAt: string;
  student?: Student;
}

export interface ScanQRResult {
  event: TripEvent;
  student: Student;
  attendance: { status: string; boardTime?: string; exitTime?: string };
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: string;
  location?: string;
  createdAt: string;
}
