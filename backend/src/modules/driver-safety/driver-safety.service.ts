import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class DriverSafetyService {
  constructor(private prisma: PrismaService) {}

  async recordEvent(data: {
    driverId: string;
    tripId?: string;
    eventType: string;
    description: string;
    severity?: number;
    latitude?: number;
    longitude?: number;
    speed?: number;
    value?: number;
    metadata?: Record<string, unknown>;
  }) {
    const event = await (this.prisma as any).driverSafetyEvent.create({
      data: {
        driverId: data.driverId,
        tripId: data.tripId,
        eventType: data.eventType,
        description: data.description,
        severity: data.severity ?? 1,
        latitude: data.latitude,
        longitude: data.longitude,
        speed: data.speed,
        value: data.value,
        metadata: data.metadata || undefined,
      },
    });

    await this.recalculateScore(data.driverId);
    return event;
  }

  async recalculateScore(driverId: string) {
    const events = await (this.prisma as any).driverSafetyEvent.findMany({
      where: { driverId },
      orderBy: { createdAt: 'desc' },
    });

    const totals = {
      overspeedCount: events.filter((e: any) => e.eventType === 'OVERSPEED').length,
      deviationCount: events.filter((e: any) => e.eventType === 'ROUTE_DEVIATION').length,
      idleEventCount: events.filter((e: any) => e.eventType === 'LONG_IDLE').length,
      missedStopCount: events.filter((e: any) => e.eventType === 'MISSED_STOP').length,
      hardBrakeCount: events.filter((e: any) => e.eventType === 'HARD_BRAKE').length,
      gpsDropCount: events.filter((e: any) => e.eventType === 'GPS_DISCONNECTED').length,
      emergencyCount: events.filter((e: any) => e.eventType === 'EMERGENCY_TRIGGERED').length,
    };

    const penalty =
      totals.overspeedCount * 3 +
      totals.deviationCount * 5 +
      totals.idleEventCount * 1 +
      totals.missedStopCount * 4 +
      totals.hardBrakeCount * 3 +
      totals.gpsDropCount * 2 +
      totals.emergencyCount * 10;

    const tripCount = await this.prisma.trip.count({
      where: { driverId, status: 'COMPLETED' },
    });

    const overallScore = Math.max(0, Math.min(100, 100 - penalty));
    let totalDistance = 0;

    const lastTrip = await this.prisma.trip.findFirst({
      where: { driverId, status: 'COMPLETED' },
      orderBy: { completedAt: 'desc' },
      select: { id: true },
    });

    if (lastTrip) {
      const tripEvents = await this.prisma.tripEvent.findMany({
        where: { tripId: lastTrip.id, latitude: { not: null } },
        orderBy: { createdAt: 'asc' },
        select: { latitude: true, longitude: true },
      });
      for (let i = 1; i < tripEvents.length; i++) {
        const prev = tripEvents[i - 1];
        const curr = tripEvents[i];
        if (prev.latitude && prev.longitude && curr.latitude && curr.longitude) {
          totalDistance += this.haversine(prev.latitude, prev.longitude, curr.latitude, curr.longitude);
        }
      }
    }

    return (this.prisma as any).driverSafetyScore.upsert({
      where: { driverId },
      update: { overallScore, tripCount, totalDistance, ...totals, lastUpdated: new Date() },
      create: { driverId, overallScore, tripCount, totalDistance, ...totals },
    });
  }

  async getScore(driverId: string) {
    let score = await (this.prisma as any).driverSafetyScore.findUnique({
      where: { driverId },
      include: { driver: { select: { id: true, firstName: true, lastName: true, email: true } } },
    });
    if (!score) {
      score = await this.recalculateScore(driverId);
    }
    return score;
  }

  async getAllScores(schoolId?: string) {
    const where: any = {};
    if (schoolId) {
      where.driver = { schoolId };
    }
    return (this.prisma as any).driverSafetyScore.findMany({
      where,
      include: {
        driver: { select: { id: true, firstName: true, lastName: true, email: true, schoolId: true } },
      },
      orderBy: { overallScore: 'desc' },
    });
  }

  async getEvents(driverId: string, limit = 50) {
    return (this.prisma as any).driverSafetyEvent.findMany({
      where: { driverId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { trip: { select: { id: true, type: true, scheduledAt: true } } },
    });
  }

  async detectOverspeed(payload: { driverId: string; speed: number; lat: number; lng: number; tripId?: string }) {
    if (payload.speed > 60) {
      const severity = payload.speed > 80 ? 5 : payload.speed > 70 ? 3 : 1;
      await this.recordEvent({
        driverId: payload.driverId,
        tripId: payload.tripId,
        eventType: 'OVERSPEED',
        description: `Speed ${Math.round(payload.speed)} km/h exceeded limit`,
        severity,
        latitude: payload.lat,
        longitude: payload.lng,
        speed: payload.speed,
      });
    }
  }

  async detectHardBrake(payload: { driverId: string; speedDelta: number; lat: number; lng: number; tripId?: string }) {
    if (payload.speedDelta < -15) {
      await this.recordEvent({
        driverId: payload.driverId,
        tripId: payload.tripId,
        eventType: 'HARD_BRAKE',
        description: `Rapid deceleration of ${Math.abs(Math.round(payload.speedDelta))} km/h detected`,
        severity: Math.min(5, Math.floor(Math.abs(payload.speedDelta) / 10)),
        latitude: payload.lat,
        longitude: payload.lng,
        value: payload.speedDelta,
      });
    }
  }

  async detectGpsDisconnect(driverId: string) {
    await this.recordEvent({
      driverId,
      eventType: 'GPS_DISCONNECTED',
      description: 'GPS signal lost',
      severity: 3,
    });
  }

  private haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
}
