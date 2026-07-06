export interface GPSData {
  busId: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  timestamp: Date;
  accuracy?: number;
  altitude?: number;
}

export interface CameraCapture {
  busId: string;
  studentId?: string;
  imageData: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface FaceVerificationResult {
  studentId: string;
  confidence: number;
  verified: boolean;
  timestamp: Date;
  imageUrl?: string;
}

export interface IoTEvent {
  deviceId: string;
  deviceType: 'GPS' | 'CAMERA' | 'FACE_VERIFICATION' | 'SENSOR';
  eventType: string;
  payload: Record<string, unknown>;
  timestamp: Date;
  signature?: string;
}

export interface HardwareDevice {
  id: string;
  type: 'GPS' | 'CAMERA' | 'FACE_VERIFICATION' | 'SENSOR';
  name: string;
  model?: string;
  firmwareVersion?: string;
  status: 'ONLINE' | 'OFFLINE' | 'ERROR';
  lastHeartbeat?: Date;
  metadata?: Record<string, unknown>;
}

export interface IGPSService {
  getCurrentLocation(busId: string): Promise<GPSData>;
  startTracking(busId: string, intervalMs: number): Promise<void>;
  stopTracking(busId: string): Promise<void>;
  getRouteHistory(busId: string, startDate: Date, endDate: Date): Promise<GPSData[]>;
}

export interface ICameraService {
  captureImage(busId: string, studentId?: string): Promise<CameraCapture>;
  startStreaming(busId: string): Promise<void>;
  stopStreaming(busId: string): Promise<void>;
  getLatestCapture(busId: string): Promise<CameraCapture | null>;
}

export interface IFaceVerificationService {
  verifyStudent(studentId: string, imageData: string): Promise<FaceVerificationResult>;
  enrollStudent(studentId: string, images: string[]): Promise<void>;
  removeStudent(studentId: string): Promise<void>;
}

export interface IIoTService {
  registerDevice(device: Omit<HardwareDevice, 'status' | 'lastHeartbeat'>): Promise<HardwareDevice>;
  unregisterDevice(deviceId: string): Promise<void>;
  handleEvent(event: IoTEvent): Promise<void>;
  getDeviceStatus(deviceId: string): Promise<HardwareDevice>;
}
