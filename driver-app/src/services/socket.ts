import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SOCKET_URL = __DEV__ ? 'http://localhost:3000' : 'https://api.saferide.com.np';

let socket: Socket | null = null;

export const connect = async () => {
  if (socket?.connected) return;
  try {
    const token = await AsyncStorage.getItem('accessToken');
    socket = io(`${SOCKET_URL}/tracking`, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 3000,
    });
  } catch (error) {
    console.error('Socket connect error:', error);
  }
};

export const disconnect = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const emitLocation = (
  tripId: string,
  lat: number,
  lng: number,
  speed: number,
  heading: number,
) => {
  if (socket?.connected) {
    socket.emit('driver:location', { tripId, lat, lng, speed, heading });
  }
};

export const emitTripStatus = (tripId: string, status: string, notes?: string) => {
  if (socket?.connected) {
    socket.emit('driver:trip:status', { tripId, status, notes });
  }
};

export const emitEmergency = (
  tripId: string,
  type: string,
  payload?: { lat?: number; lng?: number; message?: string },
) => {
  if (socket?.connected) {
    socket.emit('driver:emergency', { tripId, type, ...payload });
  }
};

export const onTripUpdate = (callback: (data: { tripId: string; status: string }) => void) => {
  if (!socket) return () => {};
  socket.on('trip:updated', callback);
  return () => { socket?.off('trip:updated', callback); };
};

export const onStudentUpdate = (callback: (data: { tripId: string; studentId: string; scanType: string }) => void) => {
  if (!socket) return () => {};
  socket.on('student:updated', callback);
  return () => { socket?.off('student:updated', callback); };
};

export const getSocket = () => socket;
