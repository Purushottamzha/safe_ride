import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getOverview(schoolId?: string) {
    const whereSchool = schoolId ? { schoolId } : {};
    const whereSchoolOrUndefined = schoolId ? { schoolId } : {};

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 86400000);

    const [
      totalStudents,
      totalDrivers,
      totalBuses,
      activeTrips,
      todayAttendance,
      todayTripsCount,
      completedTrips,
      delayedTrips,
      avgSafetyScore,
      pendingIncidents,
    ] = await Promise.all([
      this.prisma.student.count({ where: { ...whereSchool, isActive: true, deletedAt: null } }),
      this.prisma.driver.count({ where: { ...whereSchoolOrUndefined, isAvailable: true } }),
      this.prisma.bus.count({ where: { ...whereSchoolOrUndefined, status: 'ACTIVE' } }),
      this.prisma.trip.count({ where: { ...whereSchool, status: { in: ['ACTIVE', 'DRIVING_TO_PICKUP', 'AT_STOP', 'BOARDING', 'DRIVING_TO_SCHOOL', 'SCHOOL_ARRIVED', 'DRIVING_TO_DROP', 'DROPPING'] } } }),
      this.prisma.attendance.aggregate({
        where: { ...whereSchool, date: { gte: todayStart, lt: todayEnd } },
        _count: true,
      }),
      this.prisma.trip.count({ where: { ...whereSchool, scheduledAt: { gte: todayStart, lt: todayEnd } } }),
      this.prisma.trip.count({ where: { ...whereSchool, status: 'COMPLETED', scheduledAt: { gte: todayStart, lt: todayEnd } } }),
      this.prisma.trip.count({ where: { ...whereSchool, status: { notIn: ['COMPLETED', 'CANCELLED'] }, scheduledAt: { gte: todayStart, lt: todayEnd } } }),
      this.prisma.driverSafetyScore.aggregate({ _avg: { overallScore: true } }),
      this.prisma.incident.count({ where: { ...whereSchool, status: { notIn: ['RESOLVED', 'CLOSED'] } } }),
    ]);

    const totalTodayAttendance = await this.prisma.attendance.count({
      where: { ...whereSchool, date: { gte: todayStart, lt: todayEnd } },
    });

    const presentCount = await this.prisma.attendance.count({
      where: { ...whereSchool, date: { gte: todayStart, lt: todayEnd }, status: { in: ['PRESENT', 'BOARDED'] } },
    });

    const delayedCount = await this.prisma.trip.count({
      where: { ...whereSchool, scheduledAt: { gte: todayStart, lt: todayEnd }, notes: { contains: 'delayed' } },
    });

    return {
      totalStudents,
      activeDrivers: totalDrivers,
      activeBuses: totalBuses,
      activeTrips,
      todayStats: {
        totalAttendance: totalTodayAttendance,
        present: presentCount,
        absent: totalTodayAttendance - presentCount,
        attendanceRate: totalTodayAttendance > 0 ? Math.round((presentCount / totalTodayAttendance) * 100) : 0,
      },
      trips: {
        total: todayTripsCount,
        completed: completedTrips,
        delayed: delayedCount || 0,
        onTimeRate: todayTripsCount > 0 ? Math.round(((todayTripsCount - (delayedCount || 0)) / todayTripsCount) * 100) : 0,
      },
      fleetUtilization: totalBuses > 0 ? Math.round((activeTrips / totalBuses) * 100) : 0,
      safetyScore: avgSafetyScore._avg.overallScore ?? 100,
      pendingIncidents,
    };
  }

  async getAttendanceTrends(schoolId?: string, days = 30) {
    const whereSchool = schoolId ? { schoolId } : {};
    const results: { date: string; present: number; absent: number; late: number; total: number; rate: number }[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const day = new Date();
      day.setDate(day.getDate() - i);
      const start = new Date(day.getFullYear(), day.getMonth(), day.getDate());
      const end = new Date(start.getTime() + 86400000);

      const [total, present, absent, late] = await Promise.all([
        this.prisma.attendance.count({ where: { ...whereSchool, date: { gte: start, lt: end } } }),
        this.prisma.attendance.count({ where: { ...whereSchool, date: { gte: start, lt: end }, status: { in: ['PRESENT', 'BOARDED'] } } }),
        this.prisma.attendance.count({ where: { ...whereSchool, date: { gte: start, lt: end }, status: { in: ['ABSENT', 'NOT_BOARDED'] } } }),
        this.prisma.attendance.count({ where: { ...whereSchool, date: { gte: start, lt: end }, status: 'LATE' } }),
      ]);

      results.push({
        date: start.toISOString().split('T')[0],
        present, absent, late, total,
        rate: total > 0 ? Math.round((present / total) * 100) : 0,
      });
    }

    return results;
  }

  async getDriverRanking(schoolId?: string) {
    const whereSchool = schoolId ? { schoolId } : {};
    const scores = await this.prisma.driverSafetyScore.findMany({
      where: schoolId ? { driver: { schoolId } } : {},
      include: {
        driver: { select: { id: true, firstName: true, lastName: true, profilePicture: true } },
      },
      orderBy: { overallScore: 'desc' },
      take: 20,
    });

    const withTrips = await Promise.all(
      scores.map(async (s) => {
        const tripCount = await this.prisma.trip.count({
          where: { driverId: s.driverId, status: 'COMPLETED' },
        });
        return { ...s, completedTrips: tripCount };
      }),
    );

    return withTrips;
  }

  async getDelayMetrics(schoolId?: string) {
    const whereSchool = schoolId ? { schoolId } : {};
    const routes = await this.prisma.route.findMany({
      where: schoolId ? { schoolId } : {},
      include: {
        trips: {
          where: { status: 'COMPLETED' },
          select: { id: true, scheduledAt: true, startedAt: true, completedAt: true, notes: true },
          take: 50,
          orderBy: { scheduledAt: 'desc' },
        },
        _count: { select: { routeStops: true } },
      },
    });

    return routes.map((r) => {
      const delays = r.trips
        .filter((t) => t.startedAt && t.scheduledAt)
        .map((t) => Math.max(0, (t.startedAt!.getTime() - t.scheduledAt.getTime()) / 60000));
      const avgDelay = delays.length > 0 ? delays.reduce((a, b) => a + b, 0) / delays.length : 0;
      const tripCount = r.trips.length;

      return {
        routeId: r.id,
        routeName: r.name,
        stopCount: r._count.routeStops,
        tripCount,
        avgDelay: Math.round(avgDelay * 10) / 10,
        maxDelay: delays.length > 0 ? Math.round(Math.max(...delays) * 10) / 10 : 0,
        onTimeRate: tripCount > 0 ? Math.round((delays.filter((d) => d <= 2).length / tripCount) * 100) : 0,
      };
    });
  }

  async getFleetUtilization(schoolId?: string) {
    const whereSchool = schoolId ? { schoolId } : {};
    const buses = await this.prisma.bus.findMany({
      where: { ...whereSchool, status: 'ACTIVE' },
      select: {
        id: true, busNumber: true, plateNumber: true, capacity: true,
        _count: { select: { trips: { where: { status: 'COMPLETED' } } } },
      },
    });

    const maxTripsToday = Math.max(1, await this.prisma.trip.count({
      where: { ...whereSchool, status: 'COMPLETED', scheduledAt: { gte: new Date(Date.now() - 86400000) } },
    }));

    return buses.map((b) => ({
      busId: b.id,
      busNumber: b.busNumber,
      plateNumber: b.plateNumber,
      capacity: b.capacity,
      completedTrips: b._count.trips,
      utilization: Math.min(100, Math.round((b._count.trips / maxTripsToday) * 100)),
    }));
  }
}
