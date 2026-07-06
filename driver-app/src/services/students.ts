import api from './api';
import { Student, ScanQRResult } from '../types';

export const getStudentsByTrip = async (tripId: string): Promise<Student[]> => {
  const response = await api.get<Student[]>('/api/v1/students', {
    params: { tripId },
  });
  return response.data;
};

export const scanQR = async (
  qrToken: string,
  tripId: string,
  scanType: 'BOARD_IN' | 'EXIT_OUT',
  latitude?: number,
  longitude?: number,
): Promise<ScanQRResult> => {
  const response = await api.post<ScanQRResult>('/api/v1/qr/scan', {
    qrToken,
    tripId,
    scanType,
    latitude,
    longitude,
  });
  return response.data;
};
