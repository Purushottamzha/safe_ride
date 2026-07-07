import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/authStore';

interface BusLocation {
  busId: string;
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  tripId: string;
  driverName: string;
  routeName: string;
  occupancy: number;
  capacity: number;
  eta: string;
  nextStopName: string;
  nextStopDistance: number;
  remainingDistance: number;
  stopSequence: number;
  totalStops: number;
  completedStops: number;
  tripStatus: string;
  lastUpdate: string;
}

type BusLocationHandler = (data: BusLocation) => void;
type NotificationHandler = (data: { id: string; type: string; title: string; body: string }) => void;

type EventHandlerMap = {
  'bus:location': BusLocationHandler;
  'notification': NotificationHandler;
};

class SocketService {
  private socket: Socket | null = null;

  connect() {
    if (this.socket?.connected) return;

    const token = useAuthStore.getState().accessToken;
    const baseURL = import.meta.env.VITE_API_URL || '';

    this.socket = io(`${baseURL}/tracking`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
      if (error.message.includes('401')) {
        useAuthStore.getState().logout();
      }
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on<T extends keyof EventHandlerMap>(event: T, handler: EventHandlerMap[T]) {
    this.socket?.on(event, handler as any);
  }

  off<T extends keyof EventHandlerMap>(event: T, handler: EventHandlerMap[T]) {
    this.socket?.off(event, handler as any);
  }

  emit(event: string, data: unknown) {
    this.socket?.emit(event, data);
  }

  get connected() {
    return this.socket?.connected ?? false;
  }
}

export const socketService = new SocketService();
