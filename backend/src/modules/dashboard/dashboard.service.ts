import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma, BusStatus, TripStatus, AttendanceStatus, IncidentStatus } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats(schoolId?: string) {
    const schoolFilter = schoolId ? { schoolId } : {};

    const [
      totalStudents,
      totalDrivers,
      totalBuses,
      activeBuses,
      activeTrips,
      presentCount,
      absentCount,
      lateCount,
      pendingIncidents,
      recentActivity,
    ] = await Promise.all([
      this.prisma.student.count({ where: { ...schoolFilter, deletedAt: null } }),
      this.prisma.driver.count({ where: { ...schoolFilter, deletedAt: null } }),
      this.prisma.bus.count({ where: { ...schoolFilter, deletedAt: null } }),
      this.prisma.bus.count({
        where: { ...schoolFilter, status: BusStatus.ACTIVE, deletedAt: null },
      }),
      this.prisma.trip.count({
        where: { ...schoolFilter, status: TripStatus.ACTIVE, deletedAt: null },
      }),
      this.prisma.attendance.count({
        where: {
          ...schoolFilter,
          status: AttendanceStatus.PRESENT,
          date: { gte: this.todayStart() },
        },
      }),
      this.prisma.attendance.count({
        where: {
          ...schoolFilter,
          status: AttendanceStatus.ABSENT,
          date: { gte: this.todayStart() },
        },
      }),
      this.prisma.attendance.count({
        where: {
          ...schoolFilter,
          status: AttendanceStatus.LATE,
          date: { gte: this.todayStart() },
        },
      }),
      this.prisma.incident.count({
        where: {
          ...schoolFilter,
          status: { in: [IncidentStatus.REPORTED, IncidentStatus.INVESTIGATING] },
        },
      }),
      this.prisma.tripEvent.findMany({
        where: schoolFilter as Prisma.TripEventWhereInput,
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          trip: {
            select: { id: true, type: true, status: true },
          },
          student: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      }),
    ]);

    return {
      totalStudents,
      totalDrivers,
      totalBuses,
      activeBuses,
      activeTrips,
      todayAttendance: {
        present: presentCount,
        absent: absentCount,
        late: lateCount,
        total: presentCount + absentCount + lateCount,
      },
      pendingIncidents,
      recentActivity,
    };
  }

  private todayStart(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
}
