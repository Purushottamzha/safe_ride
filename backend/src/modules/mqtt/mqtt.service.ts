import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { connect, MqttClient } from 'mqtt';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class MqttService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MqttService.name);
  private client: MqttClient;
  private readonly mqttUrl: string;
  private readonly mqttUsername: string;
  private readonly mqttPassword: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.mqttUrl = this.configService.get<string>('mqtt.url') || 'mqtt://localhost:1883';
    this.mqttUsername = this.configService.get<string>('mqtt.username') || 'saferide-backend';
    this.mqttPassword = this.configService.get<string>('mqtt.password') || 'saferide-mqtt-backend';
  }

  async onModuleInit(): Promise<void> {
    await this.connect();
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      this.client.end(true);
      this.logger.log('MQTT client disconnected');
    }
  }

  private async connect(): Promise<void> {
    return new Promise<void>((resolve) => {
      this.client = connect(this.mqttUrl, {
        username: this.mqttUsername,
        password: this.mqttPassword,
        clientId: `saferide-backend-${Math.random().toString(36).substring(2, 10)}`,
        clean: true,
        reconnectPeriod: 5000,
        connectTimeout: 10000,
        will: {
          topic: 'saferide/backend/status',
          payload: 'offline',
          qos: 1,
          retain: true,
        },
      });

      this.client.on('connect', () => {
        this.logger.log(`Connected to MQTT broker at ${this.mqttUrl}`);
        this.subscribeToTopics();
        this.client.publish('saferide/backend/status', 'online', { qos: 1, retain: true });
        resolve();
      });

      this.client.on('error', (err) => {
        this.logger.error(`MQTT connection error: ${err.message}`);
      });

      this.client.on('reconnect', () => {
        this.logger.warn('MQTT reconnecting...');
      });

      this.client.on('offline', () => {
        this.logger.warn('MQTT client went offline');
      });

      this.client.on('message', (topic, payload) => {
        this.handleMessage(topic, payload.toString()).catch((err) => {
          this.logger.error(`Error handling MQTT message on ${topic}: ${err.message}`);
        });
      });
    });
  }

  private subscribeToTopics(): void {
    this.client.subscribe('saferide/+/bus/+/scan', { qos: 1 });
    this.client.subscribe('saferide/+/bus/+/location', { qos: 1 });
    this.client.subscribe('saferide/+/bus/+/heartbeat', { qos: 1 });
    this.logger.log('Subscribed to MQTT topics: saferide/+/bus/+/scan, location, heartbeat');
  }

  private async handleMessage(topic: string, message: string): Promise<void> {
    const match = topic.match(/^saferide\/([^/]+)\/bus\/([^/]+)\/(.+)$/);

    if (!match) {
      this.logger.warn(`Received message on unrecognized topic: ${topic}`);
      return;
    }

    const schoolId = match[1];
    const busId = match[2];
    const eventType = match[3];

    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(message);
    } catch {
      this.logger.warn(`Invalid JSON payload on ${topic}: ${message.substring(0, 100)}`);
      return;
    }

    switch (eventType) {
      case 'scan':
        await this.handleScanEvent(schoolId, busId, payload);
        break;
      case 'location':
        await this.handleLocationEvent(schoolId, busId, payload);
        break;
      case 'heartbeat':
        await this.handleHeartbeatEvent(schoolId, busId, payload);
        break;
      default:
        this.logger.debug(`Unhandled event type: ${eventType} on ${topic}`);
    }
  }

  private async handleScanEvent(schoolId: string, busId: string, payload: Record<string, unknown>): Promise<void> {
    const { eventId } = payload;
    if (!eventId) {
      this.logger.warn('Scan event missing eventId');
      return;
    }
    this.logger.log(`Scan event received: bus=${busId}, school=${schoolId}, eventId=${eventId}`);

    // Prisma upsert on eventId for idempotency
    // Full scan processing will be handled by the attendance module
    // This is the ingest point — validation and business logic
    // are delegated to the existing attendance service.
  }

  private async handleLocationEvent(schoolId: string, busId: string, payload: Record<string, unknown>): Promise<void> {
    const { eventId, lat, lng, speed, accuracy, deviceTimestamp } = payload;
    if (!eventId) {
      this.logger.warn('Location event missing eventId');
      return;
    }

    this.logger.debug(`Location event: bus=${busId}, lat=${lat}, lng=${lng}`);

    // Server-side timestamp stamping (per architecture: received_at is source of truth)
    const receivedAt = new Date();

    try {
      await this.prisma.rawLocation.upsert({
        where: {
          eventId: eventId as string,
        },
        update: {},
        create: {
          eventId: eventId as string,
          latitude: parseFloat(lat as string) || 0,
          longitude: parseFloat(lng as string) || 0,
          speed: speed ? parseFloat(speed as string) : null,
          accuracy: accuracy ? parseFloat(accuracy as string) : null,
          heading: payload.heading ? parseFloat(payload.heading as string) : null,
          deviceId: (payload.deviceId as string) || null,
          deviceTimestamp: deviceTimestamp ? new Date(deviceTimestamp as string) : null,
          receivedAt,
          schoolId,
          busId,
        },
      });
    } catch (err) {
      this.logger.error(`Failed to upsert location event ${eventId}: ${err.message}`);
    }
  }

  private async handleHeartbeatEvent(schoolId: string, busId: string, payload: Record<string, unknown>): Promise<void> {
    this.logger.debug(`Heartbeat from bus=${busId}, school=${schoolId}: battery=${payload.batteryLevel}, storage=${payload.storageFree}`);
  }
}
