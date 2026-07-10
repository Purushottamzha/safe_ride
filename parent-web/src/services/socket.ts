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
  private handlers = new Map<string, Set<Function>>();

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

    this.socket.io.on('reconnect_attempt', () => {
      const freshToken = useAuthStore.getState().accessToken;
      if (this.socket) {
        this.socket.auth = { token: freshToken };
      }
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.handlers.clear();
  }

  on<T extends keyof EventHandlerMap>(event: T, handler: EventHandlerMap[T]) {
    this.socket?.on(event, handler as any);
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler as Function);
  }

  off<T extends keyof EventHandlerMap>(event: T, handler: EventHandlerMap[T]) {
    this.socket?.off(event, handler as any);
    this.handlers.get(event)?.delete(handler as Function);
  }

  emit(event: string, data: unknown) {
    this.socket?.emit(event, data);
  }

  get connected() {
    return this.socket?.connected ?? false;
  }
}

export const socketService = new SocketService();
