import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;

  connect(token: string): Socket {
    if (this.socket?.connected) return this.socket;

    const baseUrl = import.meta.env.VITE_API_URL || '';
    this.socket = io(`${baseUrl}/tracking`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
    });

    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  onBusLocation(callback: (data: BusLocation) => void): () => void {
    if (!this.socket) return () => {};
    this.socket.on('bus:location', callback);
    return () => this.socket?.off('bus:location', callback);
  }

  onTripStatus(callback: (data: { tripId: string; status: string; notes?: string; timestamp: string }) => void): () => void {
    if (!this.socket) return () => {};
    this.socket.on('trip:status', callback);
    return () => this.socket?.off('trip:status', callback);
  }

  onEmergencyAlert(callback: (data: EmergencyAlert) => void): () => void {
    if (!this.socket) return () => {};
    this.socket.on('emergency:alert', callback);
    return () => this.socket?.off('emergency:alert', callback);
  }

  requestAllBuses(): void {
    if (!this.socket) return;
    this.socket.emit('admin:request-buses');
  }

  onAllBuses(callback: (buses: BusLocation[]) => void): () => void {
    if (!this.socket) return () => {};
    this.socket.on('buses:all', callback);
    return () => this.socket?.off('buses:all', callback);
  }

  onNotificationNew(callback: (data: NotificationPayload) => void): () => void {
    if (!this.socket) return () => {};
    this.socket.on('notification:new', callback);
    return () => this.socket?.off('notification:new', callback);
  }

  onIncidentAlert(callback: (data: IncidentAlert) => void): () => void {
    if (!this.socket) return () => {};
    this.socket.on('incident:alert', callback);
    return () => this.socket?.off('incident:alert', callback);
  }

  onIncidentResolved(callback: (data: { id: string; title: string; resolution: string; timestamp: string }) => void): () => void {
    if (!this.socket) return () => {};
    this.socket.on('incident:resolved', callback);
    return () => this.socket?.off('incident:resolved', callback);
  }
}

export interface NotificationPayload {
  id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  createdAt: string;
}

export interface BusLocation {
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
  batteryLevel?: number;
  gpsAccuracy?: number;
  scannerStatus?: string;
  lastHeartbeatAt?: string;
  firmwareVersion?: string;
  lastQrScanAt?: string;
}

export interface IncidentAlert {
  id: string;
  title: string;
  severity: string;
  description: string;
  latitude?: number;
  longitude?: number;
  busId?: string;
  busNumber?: string;
  timestamp: string;
}

export interface EmergencyAlert {
  type: string;
  tripId: string;
  lat?: number;
  lng?: number;
  message?: string;
  timestamp: string;
}

export const socketService = new SocketService();
