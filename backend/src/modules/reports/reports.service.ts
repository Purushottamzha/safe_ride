import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(private prisma: PrismaService) {}

  async getDailyAttendance(schoolId: string, date: string) {
    if (!date) throw new BadRequestException('Date parameter is required');
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) throw new BadRequestException('Invalid date format');

    const startOfDay = new Date(dateObj.setHours(0, 0, 0, 0));
    const endOfDay = new Date(dateObj.setHours(23, 59, 59, 999));

    const totalStudents = await this.prisma.student.count({
      where: { schoolId, deletedAt: null, isActive: true },
    });

    const attendance = await this.prisma.attendance.findMany({
      where: {
        schoolId,
        date: { gte: startOfDay, lte: endOfDay },
      },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, studentId: true, grade: true, section: true } },
      },
    });

    const trips = await this.prisma.trip.findMany({
      where: {
        schoolId,
        scheduledAt: { gte: startOfDay, lte: endOfDay },
      },
      include: {
        _count: { select: { attendance: true, tripEvents: true } },
      },
    });

    return {
      date,
      schoolId,
      summary: {
        totalStudents,
        presentToday: attendance.filter((a) => a.status === 'PRESENT').length,
        absentToday: attendance.filter((a) => a.status === 'ABSENT').length,
        lateToday: attendance.filter((a) => a.isLate).length,
        excusedToday: attendance.filter((a) => a.status === 'EXCUSED').length,
        noRecord: totalStudents - attendance.length,
      },
      attendance,
      trips,
    };
  }

  async getMonthlyAttendance(schoolId: string, month: number, year: number) {
    if (!month || !year) throw new BadRequestException('Month and year are required');
    if (month < 1 || month > 12) throw new BadRequestException('Month must be between 1 and 12');

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const attendance = await this.prisma.attendance.findMany({
      where: {
        schoolId,
        date: { gte: startDate, lte: endDate },
      },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, studentId: true, grade: true, section: true } },
      },
    });

    const totalStudents = await this.prisma.student.count({
      where: { schoolId, deletedAt: null, isActive: true },
    });

    const daysPresent = new Map<string, number>();
    for (const record of attendance) {
      if (record.status === 'PRESENT') {
        const key = record.studentId;
        daysPresent.set(key, (daysPresent.get(key) || 0) + 1);
      }
    }

    const totalDays = new Set(attendance.map((a) => a.date.toISOString().split('T')[0])).size || 1;

    const studentAttendanceSummary = Array.from(daysPresent.entries()).map(([studentId, days]) => {
      const student = attendance.find((a) => a.studentId === studentId)?.student;
      return {
        studentId,
        studentName: student ? `${student.firstName} ${student.lastName}` : 'Unknown',
        studentIdCode: student?.studentId || '',
        grade: student?.grade || '',
        section: student?.section || '',
        daysPresent: days,
        daysAbsent: totalDays - days,
        attendancePercentage: Math.round((days / totalDays) * 100),
      };
    });

    return {
      month,
      year,
      schoolId,
      totalStudents,
      totalSchoolDays: totalDays,
      summary: {
        totalRecords: attendance.length,
        presentCount: attendance.filter((a) => a.status === 'PRESENT').length,
        absentCount: attendance.filter((a) => a.status === 'ABSENT').length,
        lateCount: attendance.filter((a) => a.isLate).length,
        excusedCount: attendance.filter((a) => a.status === 'EXCUSED').length,
        averageAttendance: totalStudents > 0
          ? Math.round((daysPresent.size / totalStudents) * 100)
          : 0,
      },
      studentSummaries: studentAttendanceSummary,
    };
  }

  async getDriverPerformance(
    schoolId: string,
    fromDate: string,
    toDate: string,
    driverId?: string,
  ) {
    if (!fromDate || !toDate) throw new BadRequestException('fromDate and toDate are required');

    const driverWhere: Record<string, unknown> = { schoolId, deletedAt: null };
    if (driverId) driverWhere.id = driverId;

    const drivers = await this.prisma.driver.findMany({
      where: driverWhere,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        driverAssignments: {
          include: {
            assignment: {
              include: {
                studentAssignments: { where: { isActive: true }, select: { id: true } },
                trips: {
                  where: {
                    scheduledAt: { gte: new Date(fromDate), lte: new Date(toDate) },
                    deletedAt: null,
                  },
                },
              },
            },
          },
        },
      },
    });

    return drivers.map((driver) => {
      const trips = driver.driverAssignments.flatMap((da) => da.assignment.trips);
      const completedTrips = trips.filter((t) => t.status === 'COMPLETED');
      const cancelledTrips = trips.filter((t) => t.status === 'CANCELLED');
      const activeTrips = trips.filter((t) => t.status === 'ACTIVE');
      const totalStudentsCount = driver.driverAssignments.reduce(
        (sum, da) => sum + da.assignment.studentAssignments.length, 0,
      );

      const onTimeTrips = completedTrips.filter((t) => {
        if (!t.startedAt || !t.scheduledAt) return false;
        const diffMs = t.startedAt.getTime() - t.scheduledAt.getTime();
        return diffMs <= 5 * 60 * 1000;
      });

      return {
        driverId: driver.id,
        driverName: `${driver.user.firstName} ${driver.user.lastName}`,
        email: driver.user.email,
        licenseNumber: driver.licenseNumber,
        isAvailable: driver.isAvailable,
        assignedStudents: totalStudentsCount,
        tripStats: {
          total: trips.length,
          completed: completedTrips.length,
          cancelled: cancelledTrips.length,
          active: activeTrips.length,
          completionRate: trips.length > 0 ? Math.round((completedTrips.length / trips.length) * 100) : 0,
          onTimeRate: completedTrips.length > 0 ? Math.round((onTimeTrips.length / completedTrips.length) * 100) : 0,
        },
      };
    });
  }

  async getBusUtilization(
    schoolId: string,
    fromDate: string,
    toDate: string,
    busId?: string,
  ) {
    if (!fromDate || !toDate) throw new BadRequestException('fromDate and toDate are required');

    const busWhere: Record<string, unknown> = { schoolId, deletedAt: null };
    if (busId) busWhere.id = busId;

    const buses = await this.prisma.bus.findMany({
      where: busWhere,
      include: {
        trips: {
          where: {
            scheduledAt: { gte: new Date(fromDate), lte: new Date(toDate) },
            deletedAt: null,
          },
          include: {
            _count: { select: { tripEvents: true, attendance: true } },
          },
        },
      },
    });

    return buses.map((bus) => {
      const totalTrips = bus.trips.length;
      const completedTrips = bus.trips.filter((t) => t.status === 'COMPLETED').length;
      const maxPossibleTrips = bus.capacity > 0 ? Math.ceil(totalTrips / bus.capacity) * 100 : 1;

      return {
        busId: bus.id,
        plateNumber: bus.plateNumber,
        busNumber: bus.busNumber,
        capacity: bus.capacity,
        status: bus.status,
        tripStats: {
          total: totalTrips,
          completed: completedTrips,
          utilizationRate: maxPossibleTrips > 0 ? Math.round((completedTrips / maxPossibleTrips) * 100) : 0,
        },
        totalStudentsTransported: bus.trips.reduce((sum, t) => sum + t._count.attendance, 0),
        totalEvents: bus.trips.reduce((sum, t) => sum + t._count.tripEvents, 0),
      };
    });
  }

  async getLateStudents(schoolId: string, fromDate: string, toDate: string) {
    if (!fromDate || !toDate) throw new BadRequestException('fromDate and toDate are required');

    const startDate = new Date(fromDate);
    const endDate = new Date(toDate);

    const lateAttendance = await this.prisma.attendance.findMany({
      where: {
        schoolId,
        isLate: true,
        date: { gte: startDate, lte: endDate },
      },
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true, studentId: true, grade: true, section: true },
        },
        trip: { select: { id: true, type: true, scheduledAt: true } },
      },
      orderBy: [{ studentId: 'asc' }, { date: 'desc' }],
    });

    const lateByStudent = new Map<string, {
      studentId: string;
      studentName: string;
      studentIdCode: string;
      grade: string;
      section: string;
      lateCount: number;
      totalLateMinutes: number;
      records: typeof lateAttendance;
    }>();

    for (const record of lateAttendance) {
      const key = record.studentId;
      if (!lateByStudent.has(key)) {
        lateByStudent.set(key, {
          studentId: record.student.id,
          studentName: `${record.student.firstName} ${record.student.lastName}`,
          studentIdCode: record.student.studentId,
          grade: record.student.grade,
          section: record.student.section || '',
          lateCount: 0,
          totalLateMinutes: 0,
          records: [],
        });
      }
      const entry = lateByStudent.get(key)!;
      entry.lateCount++;
      entry.totalLateMinutes += record.lateMinutes || 0;
      entry.records.push(record);
    }

    const lateStudents = Array.from(lateByStudent.values())
      .sort((a, b) => b.lateCount - a.lateCount);

    return {
      period: { fromDate, toDate },
      schoolId,
      totalLateRecords: lateAttendance.length,
      uniqueLateStudents: lateStudents.length,
      averageLateMinutes: lateAttendance.length > 0
        ? Math.round(lateAttendance.reduce((sum, r) => sum + (r.lateMinutes || 0), 0) / lateAttendance.length)
        : 0,
      lateStudents,
    };
  }

  async getAttendanceHeatmap(schoolId: string, fromDate: string, toDate: string) {
    if (!fromDate || !toDate) throw new BadRequestException('fromDate and toDate are required');

    const startDate = new Date(fromDate);
    const endDate = new Date(toDate);

    const attendance = await this.prisma.attendance.findMany({
      where: {
        schoolId,
        date: { gte: startDate, lte: endDate },
      },
      include: {
        student: { select: { grade: true, section: true } },
      },
    });

    const gradeSectionMap = new Map<string, { present: number; absent: number; late: number; excused: number; total: number }>();

    for (const record of attendance) {
      const key = `${record.student.grade}-${record.student.section || 'N/A'}`;
      if (!gradeSectionMap.has(key)) {
        gradeSectionMap.set(key, { present: 0, absent: 0, late: 0, excused: 0, total: 0 });
      }
      const entry = gradeSectionMap.get(key)!;
      entry.total++;
      if (record.status === 'PRESENT') entry.present++;
      else if (record.status === 'ABSENT') entry.absent++;
      else if (record.status === 'LATE') entry.late++;
      else if (record.status === 'EXCUSED') entry.excused++;
    }

    const dateBreakdown: Record<string, { present: number; absent: number; late: number; excused: number; total: number }> = {};
    for (const record of attendance) {
      const dateStr = record.date.toISOString().split('T')[0];
      if (!dateBreakdown[dateStr]) {
        dateBreakdown[dateStr] = { present: 0, absent: 0, late: 0, excused: 0, total: 0 };
      }
      dateBreakdown[dateStr].total++;
      if (record.status === 'PRESENT') dateBreakdown[dateStr].present++;
      else if (record.status === 'ABSENT') dateBreakdown[dateStr].absent++;
      else if (record.status === 'LATE') dateBreakdown[dateStr].late++;
      else if (record.status === 'EXCUSED') dateBreakdown[dateStr].excused++;
    }

    const heatmapData = Array.from(gradeSectionMap.entries()).map(([key, value]) => {
      const [grade, section] = key.split('-');
      return {
        grade,
        section: section === 'N/A' ? null : section,
        ...value,
        attendanceRate: value.total > 0 ? Math.round(((value.present + value.late) / value.total) * 100) : 0,
      };
    });

    return {
      period: { fromDate, toDate },
      schoolId,
      summary: {
        totalRecords: attendance.length,
        presentCount: attendance.filter((a) => a.status === 'PRESENT').length,
        absentCount: attendance.filter((a) => a.status === 'ABSENT').length,
        lateCount: attendance.filter((a) => a.status === 'LATE').length,
        excusedCount: attendance.filter((a) => a.status === 'EXCUSED').length,
      },
      byGradeSection: heatmapData,
      byDate: dateBreakdown,
    };
  }

  async getTripSummary(schoolId: string, startDate: string, endDate: string) {
    const trips = await this.prisma.trip.findMany({
      where: {
        schoolId,
        scheduledAt: { gte: new Date(startDate), lte: new Date(endDate) },
        deletedAt: null,
      },
      include: {
        driver: { select: { id: true, firstName: true, lastName: true } },
        bus: { select: { id: true, plateNumber: true, busNumber: true } },
        route: { select: { id: true, name: true, code: true } },
        _count: { select: { tripEvents: true, attendance: true } },
      },
      orderBy: { scheduledAt: 'asc' },
    });

    return {
      period: { startDate, endDate },
      totalTrips: trips.length,
      byStatus: {
        scheduled: trips.filter((t) => t.status === 'SCHEDULED').length,
        active: trips.filter((t) => t.status === 'ACTIVE').length,
        completed: trips.filter((t) => t.status === 'COMPLETED').length,
        cancelled: trips.filter((t) => t.status === 'CANCELLED').length,
      },
      byType: {
        morning: trips.filter((t) => t.type === 'MORNING').length,
        afternoon: trips.filter((t) => t.type === 'AFTERNOON').length,
      },
      totalAttendanceRecords: trips.reduce((sum, t) => sum + t._count.attendance, 0),
      totalEvents: trips.reduce((sum, t) => sum + t._count.tripEvents, 0),
      trips,
    };
  }

  async getStudentSummary(schoolId: string) {
    const totalStudents = await this.prisma.student.count({
      where: { schoolId, deletedAt: null, isActive: true },
    });

    const gradeDistribution = await this.prisma.student.groupBy({
      by: ['grade'],
      where: { schoolId, deletedAt: null, isActive: true },
      _count: true,
    });

    const studentsWithParents = await this.prisma.student.count({
      where: {
        schoolId,
        deletedAt: null,
        isActive: true,
        parentStudents: { some: {} },
      },
    });

    const studentsWithAssignments = await this.prisma.student.count({
      where: {
        schoolId,
        deletedAt: null,
        isActive: true,
        studentAssignments: { some: { isActive: true } },
      },
    });

    return {
      schoolId,
      totalStudents,
      studentsWithParents,
      studentsWithAssignments,
      unassignedStudents: totalStudents - studentsWithAssignments,
      studentsWithoutParents: totalStudents - studentsWithParents,
      gradeDistribution: gradeDistribution.map((g) => ({
        grade: g.grade,
        count: g._count,
      })),
    };
  }
}
