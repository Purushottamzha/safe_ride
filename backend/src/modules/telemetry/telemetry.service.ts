import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class TelemetryService {
  constructor(private prisma: PrismaService) {}

  async upsert(busId: string, schoolId: string, data: {
    batteryLevel?: number | null;
    storageFree?: number | null;
    gpsAccuracy?: number | null;
    mqttSignal?: number | null;
    wifiSignal?: number | null;
    scannerStatus?: string | null;
    firmwareVersion?: string | null;
    lastQrScanAt?: Date | null;
    lastHeartbeatAt?: Date | null;
  }) {
    return this.prisma.busTelemetry.upsert({
      where: { busId },
      update: data,
      create: { busId, schoolId, ...data },
    });
  }

  async findByBus(busId: string) {
    return this.prisma.busTelemetry.findUnique({
      where: { busId },
    });
  }

  async findAllBySchool(schoolId: string) {
    return this.prisma.busTelemetry.findMany({
      where: { schoolId },
      include: {
        bus: { select: { id: true, busNumber: true, plateNumber: true } },
      },
    });
  }

  async getHealthSummary(schoolId: string) {
    const telemetry = await this.prisma.busTelemetry.findMany({
      where: { schoolId },
      include: {
        bus: { select: { id: true, busNumber: true, plateNumber: true, capacity: true } },
      },
    });

    const now = Date.now();
    const fiveMinAgo = new Date(now - 300000);

    const total = telemetry.length;
    const online = telemetry.filter(t => t.lastHeartbeatAt && t.lastHeartbeatAt > fiveMinAgo).length;
    const lowBattery = telemetry.filter(t => t.batteryLevel != null && t.batteryLevel < 20).length;
    const offline = total - online;

    return {
      total,
      online,
      offline,
      lowBattery,
      details: telemetry,
    };
  }
}
