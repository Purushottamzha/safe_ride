import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  GPSData,
  CameraCapture,
  FaceVerificationResult,
  IoTEvent,
  HardwareDevice,
  IGPSService,
  ICameraService,
  IFaceVerificationService,
  IIoTService,
} from '../../common/interfaces/hardware.interface';

const KATHMANDU_LAT = 27.7172;
const KATHMANDU_LNG = 85.324;

function addJitter(value: number, range: number): number {
  return value + (Math.random() - 0.5) * range;
}

function generateDummyLocation(busId: string): GPSData {
  return {
    busId,
    latitude: addJitter(KATHMANDU_LAT, 0.01),
    longitude: addJitter(KATHMANDU_LNG, 0.01),
    speed: Math.round(Math.random() * 60 * 10) / 10,
    heading: Math.round(Math.random() * 360),
    timestamp: new Date(),
    accuracy: Math.round(Math.random() * 15 + 3),
    altitude: Math.round(
      KATHMANDU_LAT > 27.71 ? 1400 + Math.random() * 100 : 1300 + Math.random() * 100,
    ),
  };
}

@Injectable()
export class HardwareService
  implements IGPSService, ICameraService, IFaceVerificationService, IIoTService
{
  private readonly logger = new Logger(HardwareService.name);
  private trackingIntervals: Map<string, NodeJS.Timeout> = new Map();
  private devices: Map<string, HardwareDevice> = new Map();

  constructor(private prisma: PrismaService) {}

  async getCurrentLocation(busId: string): Promise<GPSData> {
    const bus = await this.prisma.bus.findFirst({ where: { id: busId, deletedAt: null } });
    if (!bus) throw new NotFoundException('Bus not found');

    const baseLat = bus.lastGpsLat || KATHMANDU_LAT;
    const baseLng = bus.lastGpsLng || KATHMANDU_LNG;

    return {
      busId,
      latitude: addJitter(baseLat, 0.002),
      longitude: addJitter(baseLng, 0.002),
      speed: Math.round(Math.random() * 60 * 10) / 10,
      heading: Math.round(Math.random() * 360),
      timestamp: new Date(),
      accuracy: Math.round(Math.random() * 10 + 5),
      altitude: Math.round(1350 + Math.random() * 100),
    };
  }

  async startTracking(busId: string, intervalMs: number): Promise<void> {
    if (this.trackingIntervals.has(busId)) {
      this.logger.warn(`Bus ${busId} is already being tracked. Restarting...`);
      await this.stopTracking(busId);
    }

    if (intervalMs < 1000) {
      this.logger.warn(`Interval ${intervalMs}ms is too low, using 1000ms minimum`);
      intervalMs = 1000;
    }

    const interval = setInterval(async () => {
      try {
        const location = generateDummyLocation(busId);
        this.logger.debug(
          `Tracking bus ${busId}: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)} @ ${location.speed}km/h`,
        );

        await this.prisma.bus.update({
          where: { id: busId },
          data: {
            lastGpsLat: location.latitude,
            lastGpsLng: location.longitude,
            lastGpsUpdate: new Date(),
          },
        });
      } catch (error) {
        this.logger.error(`Tracking error for bus ${busId}: ${(error as Error).message}`);
      }
    }, intervalMs);

    this.trackingIntervals.set(busId, interval);
    this.logger.log(`Started tracking bus ${busId} every ${intervalMs}ms`);
  }

  async stopTracking(busId: string): Promise<void> {
    const interval = this.trackingIntervals.get(busId);
    if (interval) {
      clearInterval(interval);
      this.trackingIntervals.delete(busId);
      this.logger.log(`Stopped tracking bus ${busId}`);
    } else {
      this.logger.warn(`No active tracking found for bus ${busId}`);
    }
  }

  async getRouteHistory(busId: string, startDate: Date, endDate: Date): Promise<GPSData[]> {
    const events = await this.prisma.tripEvent.findMany({
      where: {
        trip: { busId },
        createdAt: { gte: startDate, lte: endDate },
        latitude: { not: null },
        longitude: { not: null },
      },
      orderBy: { createdAt: 'asc' },
      take: 1000,
    });

    return events
      .filter(
        (e): e is typeof e & { latitude: number; longitude: number } =>
          e.latitude !== null && e.longitude !== null,
      )
      .map((e) => ({
        busId,
        latitude: e.latitude,
        longitude: e.longitude,
        speed: e.speed || 0,
        heading: e.heading || 0,
        timestamp: e.createdAt,
        accuracy: 10,
        altitude: 1400,
      }));
  }

  async captureImage(busId: string, studentId?: string): Promise<CameraCapture> {
    this.logger.log(
      `Capturing dummy image for bus ${busId}${studentId ? `, student ${studentId}` : ''}`,
    );
    return {
      busId,
      studentId,
      imageData: Buffer.from(
        JSON.stringify({
          type: 'dummy-camera-capture',
          busId,
          studentId,
          timestamp: new Date().toISOString(),
          frame: Math.random().toString(36).substring(2, 10),
        }),
      ).toString('base64'),
      timestamp: new Date(),
      metadata: {
        source: 'dummy-implementation',
        busId,
        studentId,
        resolution: '1280x720',
        format: 'jpeg',
      },
    };
  }

  async startStreaming(busId: string): Promise<void> {
    this.logger.log(`Started dummy camera streaming for bus ${busId}`);
  }

  async stopStreaming(busId: string): Promise<void> {
    this.logger.log(`Stopped dummy camera streaming for bus ${busId}`);
  }

  async getLatestCapture(busId: string): Promise<CameraCapture | null> {
    return {
      busId,
      imageData: Buffer.from(
        JSON.stringify({
          type: 'dummy-latest-capture',
          busId,
          timestamp: new Date().toISOString(),
        }),
      ).toString('base64'),
      timestamp: new Date(),
      metadata: { source: 'dummy-implementation', busId, resolution: '1280x720' },
    };
  }

  async verifyStudent(studentId: string, _imageData: string): Promise<FaceVerificationResult> {
    this.logger.log(`Dummy face verification for student ${studentId}`);

    const confidence = 0.85 + Math.random() * 0.15;
    const verified = confidence >= 0.9;

    return {
      studentId,
      confidence: Math.round(confidence * 100) / 100,
      verified,
      timestamp: new Date(),
      imageUrl: undefined,
    };
  }

  async enrollStudent(studentId: string, images: string[]): Promise<void> {
    this.logger.log(`Dummy face enrollment for student ${studentId} with ${images.length} images`);
  }

  async removeStudent(studentId: string): Promise<void> {
    this.logger.log(`Dummy face removal for student ${studentId}`);
  }

  async registerDevice(
    device: Omit<HardwareDevice, 'status' | 'lastHeartbeat'>,
  ): Promise<HardwareDevice> {
    this.logger.log(`Registering device: ${device.name} (${device.type}) [${device.id}]`);

    const registeredDevice: HardwareDevice = {
      ...device,
      status: 'ONLINE',
      lastHeartbeat: new Date(),
    };

    this.devices.set(device.id, registeredDevice);

    this.logger.log(`Device registered successfully: ${device.id}`);
    return registeredDevice;
  }

  async unregisterDevice(deviceId: string): Promise<void> {
    const device = this.devices.get(deviceId);
    if (device) {
      this.devices.delete(deviceId);
      this.logger.log(`Device unregistered: ${deviceId}`);
    } else {
      this.logger.warn(`Device not found for unregistration: ${deviceId}`);
    }
  }

  async handleEvent(event: IoTEvent): Promise<void> {
    this.logger.log(
      `IoT event received: ${event.deviceId} - ${event.eventType} (${event.deviceType})`,
    );

    if (event.deviceType === 'GPS' && event.payload) {
      const payload = event.payload as Record<string, unknown>;
      if (payload.latitude && payload.longitude) {
        const lat = Number(payload.latitude);
        const lng = Number(payload.longitude);

        await this.prisma.bus.updateMany({
          where: { gpsDeviceId: event.deviceId },
          data: {
            lastGpsLat: lat,
            lastGpsLng: lng,
            lastGpsUpdate: new Date(),
          },
        });

        this.logger.log(`GPS update processed for device ${event.deviceId}: ${lat}, ${lng}`);
      }
    }

    if (event.deviceType === 'SENSOR' && event.payload) {
      const payload = event.payload as Record<string, unknown>;
      this.logger.log(`Sensor data from ${event.deviceId}: ${JSON.stringify(payload)}`);
    }

    if (event.deviceId) {
      const device = this.devices.get(event.deviceId);
      if (device) {
        device.lastHeartbeat = new Date();
        device.status = 'ONLINE';
        this.devices.set(event.deviceId, device);
      }
    }
  }

  async getDeviceStatus(deviceId: string): Promise<HardwareDevice> {
    const cached = this.devices.get(deviceId);
    if (cached) {
      return {
        ...cached,
        lastHeartbeat: cached.lastHeartbeat || new Date(),
      };
    }

    return {
      id: deviceId,
      type: 'GPS',
      name: `Device-${deviceId.substring(0, 8)}`,
      model: 'ESP32-SIM7600',
      firmwareVersion: '1.0.0',
      status: 'ONLINE',
      lastHeartbeat: new Date(),
      metadata: { uptime: 3600, signalStrength: -65, simulated: true },
    };
  }

  async processGPSUpdate(
    busId: string,
    latitude: number,
    longitude: number,
    _speed?: number,
    _heading?: number,
  ) {
    const bus = await this.prisma.bus.findFirst({
      where: { id: busId, deletedAt: null },
    });
    if (!bus) throw new NotFoundException('Bus not found');

    return this.prisma.bus.update({
      where: { id: busId },
      data: {
        lastGpsLat: latitude,
        lastGpsLng: longitude,
        lastGpsUpdate: new Date(),
      },
    });
  }

  getActiveTrackingCount(): number {
    return this.trackingIntervals.size;
  }

  getRegisteredDevices(): HardwareDevice[] {
    return Array.from(this.devices.values());
  }

  async findActiveTripForBus(busId: string) {
    const trip = await this.prisma.trip.findFirst({
      where: {
        busId,
        status: { in: ['ACTIVE', 'DRIVING_TO_PICKUP', 'AT_STOP', 'BOARDING', 'DRIVING_TO_SCHOOL', 'SCHOOL_ARRIVED', 'DRIVING_TO_DROP', 'DROPPING'] },
        deletedAt: null,
      },
      orderBy: { scheduledAt: 'desc' },
    });
    if (!trip) throw new NotFoundException('No active trip found for this bus');
    return trip;
  }

  async getTripById(tripId: string) {
    const trip = await this.prisma.trip.findFirst({
      where: { id: tripId, deletedAt: null },
    });
    if (!trip) throw new NotFoundException('Trip not found');
    return trip;
  }

  determineScanType(trip: { status: string; type: string }): 'BOARD_IN' | 'EXIT_OUT' {
    const boardInStatuses = ['ACTIVE', 'DRIVING_TO_PICKUP', 'AT_STOP', 'BOARDING', 'DRIVING_TO_SCHOOL'];
    const exitOutStatuses = ['SCHOOL_ARRIVED', 'DRIVING_TO_DROP', 'DROPPING'];

    if (boardInStatuses.includes(trip.status)) return 'BOARD_IN';
    if (exitOutStatuses.includes(trip.status)) return 'EXIT_OUT';

    if (trip.status === 'COMPLETED') {
      throw new BadRequestException('Trip is already completed');
    }

    return trip.type === 'MORNING' ? 'BOARD_IN' : 'EXIT_OUT';
  }
}
