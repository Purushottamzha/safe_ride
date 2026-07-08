import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { connect, MqttClient } from 'mqtt';
import { ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { QRService } from '../qr/qr.service';
import { HardwareService } from '../hardware/hardware.service';

@Injectable()
export class MqttService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MqttService.name);
  private client!: MqttClient;
  private readonly mqttUrl: string;
  private readonly mqttUsername: string;
  private readonly mqttPassword: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly qrService: QRService,
    private readonly hardwareService: HardwareService,
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

      this.client.on('error', (err: Error) => {
        this.logger.error(`MQTT connection error: ${err.message}`);
      });

      this.client.on('reconnect', () => {
        this.logger.warn('MQTT reconnecting...');
      });

      this.client.on('offline', () => {
        this.logger.warn('MQTT client went offline');
      });

      this.client.on('message', (topic: string, payload: Buffer) => {
        this.handleMessage(topic, payload.toString()).catch((err: unknown) => {
          const message = err instanceof Error ? err.message : String(err);
          this.logger.error(`Unhandled error processing MQTT message on ${topic}: ${message}`);
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

  // Device identity is derived from the topic structure (broker-authenticated),
  // never from the payload body. Topic pattern saferide/{schoolId}/bus/{busId}/{event}
  // is enforced by the Mosquitto ACL — a device can only publish within its own
  // school/bus namespace, so the parsed values are trustworthy.
  private parseTopic(topic: string): { schoolId: string; busId: string; eventType: string } | null {
    const match = topic.match(/^saferide\/([^/]+)\/bus\/([^/]+)\/(.+)$/);
    if (!match) return null;
    return { schoolId: match[1], busId: match[2], eventType: match[3] };
  }

  private async handleMessage(topic: string, message: string): Promise<void> {
    const parsed = this.parseTopic(topic);
    if (!parsed) {
      this.logger.warn(`Received message on unrecognized topic: ${topic}`);
      return;
    }

    const { schoolId, busId, eventType } = parsed;

    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(message);
    } catch {
      this.logger.warn(`Invalid JSON payload on ${topic}: ${message.substring(0, 100)}`);
      return;
    }

    try {
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Error handling ${eventType} event for bus=${busId} school=${schoolId}: ${message}`);
    }
  }

  // ── Scan handling ────────────────────────────────────────────────────
  // Delegates to the existing QRService.scanQR() which handles:
  //   - Student/trip validation
  //   - Duplicate scan detection (ConflictException)
  //   - Attendance upsert
  //   - TripEvent creation
  //   - Parent notifications via NotificationGateway
  // This path must have the same end-to-end outcome as the HTTP scan endpoints.

  private async handleScanEvent(schoolId: string, busId: string, payload: Record<string, unknown>): Promise<void> {
    const eventId = payload.eventId as string | undefined;
    if (!eventId) {
      this.logger.warn('Scan event missing eventId');
      return;
    }

    const qrToken = payload.qrToken as string | undefined;
    if (!qrToken) {
      this.logger.warn(`Scan event ${eventId} missing qrToken`);
      return;
    }

    this.logger.log(`Processing scan: eventId=${eventId}, bus=${busId}, school=${schoolId}`);

    // Step 1: Validate QR token → resolve student
    let student: { id: string };
    try {
      const result = await this.qrService.validateQRToken(qrToken);
      student = result.student;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Scan event ${eventId}: QR validation failed — ${message}`);
      return;
    }

    // Step 2: Resolve trip (from payload or auto-detect from busId)
    let tripId = payload.tripId as string | undefined;
    if (!tripId) {
      try {
        const activeTrip = await this.hardwareService.findActiveTripForBus(busId);
        tripId = activeTrip.id;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.warn(`Scan event ${eventId}: no active trip found for bus=${busId} — ${message}`);
        return;
      }
    }

    // Step 3: Determine scan direction
    let trip: { status: string; type: string };
    try {
      trip = await this.hardwareService.getTripById(tripId);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Scan event ${eventId}: trip ${tripId} not found — ${message}`);
      return;
    }

    let scanType: 'BOARD_IN' | 'EXIT_OUT';
    try {
      scanType = this.hardwareService.determineScanType(trip);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Scan event ${eventId}: cannot determine scan type for trip ${tripId} — ${message}`);
      return;
    }

    // Step 4: Record attendance via QRService
    const lat = payload.latitude ? Number(payload.latitude) : undefined;
    const lng = payload.longitude ? Number(payload.longitude) : undefined;

    try {
      await this.qrService.scanQR({
        studentId: student.id,
        tripId,
        scanType,
        latitude: lat,
        longitude: lng,
      });
      this.logger.log(`Scan processed successfully: eventId=${eventId}, student=${student.id}, trip=${tripId}, type=${scanType}`);
    } catch (err: unknown) {
      if (err instanceof ConflictException) {
        // Expected on MQTT retry — duplicate scan, safe to ignore
        this.logger.debug(`Scan event ${eventId}: duplicate detected (already processed) — ${err.message}`);
        return;
      }
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Scan event ${eventId}: failed to record attendance — ${message}`);
    }
  }

  // ── Location handling ────────────────────────────────────────────────
  // deviceId is derived from the broker-authenticated topic (busId),
  // NOT from the payload body, to prevent identity spoofing.

  private async handleLocationEvent(schoolId: string, busId: string, payload: Record<string, unknown>): Promise<void> {
    const eventId = payload.eventId as string | undefined;
    if (!eventId) {
      this.logger.warn('Location event missing eventId');
      return;
    }

    this.logger.debug(`Location event: bus=${busId}, lat=${payload.lat}`);

    const receivedAt = new Date();
    // deviceId derived from topic identity, not from untrusted payload
    const deviceId = `bus:${busId}`;

    try {
      await this.prisma.rawLocation.upsert({
        where: { eventId },
        update: {},
        create: {
          eventId,
          latitude: parseFloat(payload.lat as string) || 0,
          longitude: parseFloat(payload.lng as string) || 0,
          speed: payload.speed ? parseFloat(payload.speed as string) : null,
          accuracy: payload.accuracy ? parseFloat(payload.accuracy as string) : null,
          heading: payload.heading ? parseFloat(payload.heading as string) : null,
          deviceId,
          deviceTimestamp: payload.deviceTimestamp ? new Date(payload.deviceTimestamp as string) : null,
          receivedAt,
          schoolId,
          busId,
        },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Failed to upsert location event ${eventId}: ${message}`);
    }
  }

  // ── Heartbeat handling ───────────────────────────────────────────────

  private async handleHeartbeatEvent(schoolId: string, busId: string, payload: Record<string, unknown>): Promise<void> {
    this.logger.debug(`Heartbeat from bus=${busId}, school=${schoolId}: battery=${payload.batteryLevel}, storage=${payload.storageFree}`);
  }
}
