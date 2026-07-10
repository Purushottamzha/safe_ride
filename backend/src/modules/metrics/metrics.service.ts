import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as promClient from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit {
  private readonly logger = new Logger(MetricsService.name);
  private isInitialized = false;

  public readonly httpRequestDurationMicroseconds: promClient.Histogram<string>;
  public readonly httpRequestCounter: promClient.Counter<string>;
  public readonly httpErrorCounter: promClient.Counter<string>;
  public readonly activeBusesGauge: promClient.Gauge<string>;
  public readonly dbConnectionGauge: promClient.Gauge<string>;
  public readonly redisMemoryGauge: promClient.Gauge<string>;
  public readonly mqttConnectedGauge: promClient.Gauge<string>;
  public readonly deviceHeartbeatGauge: promClient.Gauge<string>;
  public readonly deviceBatteryGauge: promClient.Gauge<string>;
  public readonly deviceGpsAccuracyGauge: promClient.Gauge<string>;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    promClient.collectDefaultMetrics({ register: promClient.register });

    this.httpRequestDurationMicroseconds = new promClient.Histogram({
      name: 'http_request_duration_ms',
      help: 'Duration of HTTP requests in ms',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000],
    });

    this.httpRequestCounter = new promClient.Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
    });

    this.httpErrorCounter = new promClient.Counter({
      name: 'http_errors_total',
      help: 'Total number of HTTP errors',
      labelNames: ['method', 'route', 'status_code'],
    });

    this.activeBusesGauge = new promClient.Gauge({
      name: 'saferide_active_buses',
      help: 'Number of buses with active trips',
    });

    this.dbConnectionGauge = new promClient.Gauge({
      name: 'saferide_db_connections',
      help: 'Number of database connections',
    });

    this.redisMemoryGauge = new promClient.Gauge({
      name: 'saferide_redis_memory_bytes',
      help: 'Redis memory usage in bytes',
    });

    this.mqttConnectedGauge = new promClient.Gauge({
      name: 'saferide_mqtt_connected',
      help: 'MQTT broker connection status (1 = connected, 0 = disconnected)',
    });

    this.deviceHeartbeatGauge = new promClient.Gauge({
      name: 'saferide_device_heartbeat_seconds',
      help: 'Seconds since last heartbeat per device',
      labelNames: ['device_id', 'bus_id'],
    });

    this.deviceBatteryGauge = new promClient.Gauge({
      name: 'saferide_device_battery_percent',
      help: 'Battery percentage per device',
      labelNames: ['device_id', 'bus_id'],
    });

    this.deviceGpsAccuracyGauge = new promClient.Gauge({
      name: 'saferide_device_gps_accuracy_meters',
      help: 'GPS accuracy in meters per device',
      labelNames: ['device_id', 'bus_id'],
    });
  }

  async onModuleInit() {
    if (this.isInitialized) return;
    this.isInitialized = true;
    this.logger.log('Prometheus metrics initialized');
  }

  async getMetrics(): Promise<string> {
    try {
      await this.collectDatabaseMetrics();
      await this.collectRedisMetrics();
    } catch (error) {
      this.logger.debug(`Metrics collection error: ${(error as Error).message}`);
    }
    return promClient.register.metrics();
  }

  private async collectDatabaseMetrics() {
    const activeTrips = await this.prisma.trip.count({
      where: { status: { notIn: ['COMPLETED', 'CANCELLED'] } },
    });
    this.activeBusesGauge.set(activeTrips);
  }

  private async collectRedisMetrics() {
    try {
      const configService = this.configService;
      const redisUrl = configService.get<string>('redis.url', 'redis://localhost:6379');
      const { Redis } = await import('ioredis');
      const redis = new Redis(redisUrl, { lazyConnect: true });
      await redis.connect();
      const info = await redis.info('memory');
      const match = info.match(/used_memory:(\d+)/);
      if (match) {
        this.redisMemoryGauge.set(parseInt(match[1], 10));
      }
      await redis.quit();
    } catch {
      this.redisMemoryGauge.set(0);
    }
  }

  setMqttConnected(connected: boolean) {
    this.mqttConnectedGauge.set(connected ? 1 : 0);
  }

  setDeviceMetrics(deviceId: string, busId: string, battery: number | null, gpsAccuracy: number | null, heartbeatAgeSec: number | null) {
    if (battery != null) this.deviceBatteryGauge.set({ device_id: deviceId, bus_id: busId }, battery);
    if (gpsAccuracy != null) this.deviceGpsAccuracyGauge.set({ device_id: deviceId, bus_id: busId }, gpsAccuracy);
    if (heartbeatAgeSec != null) this.deviceHeartbeatGauge.set({ device_id: deviceId, bus_id: busId }, heartbeatAgeSec);
  }
}
