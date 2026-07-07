import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  namespace: '/notifications',
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(NotificationGateway.name);
  private connectedClients: Map<string, Set<string>> = new Map();

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token = client.handshake.auth?.token || (client.handshake.query?.token as string);

      if (!token) {
        this.logger.warn(`Connection rejected: ${client.id} - No token provided`);
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const userId = payload.sub || payload.id;
      const role = payload.role;
      const schoolId = payload.schoolId;

      client.data.userId = userId;
      client.data.role = role;
      client.data.schoolId = schoolId;

      client.join(`user:${userId}`);

      if (schoolId) {
        client.join(`school:${schoolId}`);
      }

      if (!this.connectedClients.has(userId)) {
        this.connectedClients.set(userId, new Set());
      }
      this.connectedClients.get(userId)!.add(client.id);

      this.logger.log(`Client connected: ${client.id} (user:${userId}, role:${role})`);

      client.emit('connected', {
        userId,
        role,
        message: 'Connected to notification server',
      });
    } catch (error) {
      this.logger.warn(`Connection rejected: ${client.id} - ${(error as Error).message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket): void {
    const userId = client.data?.userId;
    if (userId && this.connectedClients.has(userId)) {
      this.connectedClients.get(userId)!.delete(client.id);
      if (this.connectedClients.get(userId)?.size === 0) {
        this.connectedClients.delete(userId);
      }
    }
    this.logger.log(`Client disconnected: ${client.id}${userId ? ` (user:${userId})` : ''}`);
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(client: Socket, payload: { schoolId: string }): void {
    if (payload?.schoolId) {
      client.join(`school:${payload.schoolId}`);
      client.data.schoolId = payload.schoolId;
      this.logger.log(`Client ${client.id} subscribed to school:${payload.schoolId}`);
      client.emit('subscribed', { schoolId: payload.schoolId });
    }
  }

  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(client: Socket, payload: { schoolId: string }): void {
    if (payload?.schoolId) {
      client.leave(`school:${payload.schoolId}`);
      this.logger.log(`Client ${client.id} unsubscribed from school:${payload.schoolId}`);
      client.emit('unsubscribed', { schoolId: payload.schoolId });
    }
  }

  @SubscribeMessage('ping')
  handlePing(client: Socket): void {
    client.emit('pong', { timestamp: new Date().toISOString() });
  }

  sendToUser(userId: string, event: string, data: unknown): void {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  sendToSchool(schoolId: string, event: string, data: unknown): void {
    this.server.to(`school:${schoolId}`).emit(event, data);
  }

  getConnectedUsersCount(): number {
    return this.connectedClients.size;
  }

  isUserConnected(userId: string): boolean {
    return this.connectedClients.has(userId) && (this.connectedClients.get(userId)?.size ?? 0) > 0;
  }
}
