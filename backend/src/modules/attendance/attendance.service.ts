import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma, TripType, AttendanceStatus } from '@prisma/client';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: {
    page?: number; limit?: number; schoolId?: string; studentId?: string;
    tripId?: string; date?: string; fromDate?: string; toDate?: string;
    startDate?: string; endDate?: string;
    type?: TripType; status?: AttendanceStatus;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.AttendanceWhereInput = {};

    if (params.schoolId) where.schoolId = params.schoolId;
    if (params.studentId) where.studentId = params.studentId;
    if (params.tripId) where.tripId = params.tripId;
    if (params.type) where.type = params.type;
    if (params.status) where.status = params.status;

    const effectiveStartDate = params.fromDate || params.startDate;
    const effectiveEndDate = params.toDate || params.endDate;

    if (params.date) {
      const dateObj = new Date(params.date);
      where.date = {
        gte: new Date(new Date(dateObj).setHours(0, 0, 0, 0)),
        lte: new Date(new Date(dateObj).setHours(23, 59, 59, 999)),
      };
    } else if (effectiveStartDate || effectiveEndDate) {
      where.date = {};
      if (effectiveStartDate) where.date.gte = new Date(effectiveStartDate);
      if (effectiveEndDate) where.date.lte = new Date(effectiveEndDate);
    }

    const [data, total] = await Promise.all([
      this.prisma.attendance.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        include: {
          student: {
            select: {
              id: true, firstName: true, lastName: true, studentId: true,
              grade: true, section: true, profilePicture: true,
            },
          },
          trip: {
            select: { id: true, type: true, status: true, scheduledAt: true },
          },
          school: { select: { id: true, name: true } },
        },
      }),
      this.prisma.attendance.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findById(id: string) {
    const record = await this.prisma.attendance.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            id: true, firstName: true, lastName: true, studentId: true,
            grade: true, section: true, profilePicture: true,
          },
        },
        trip: {
          select: {
            id: true, type: true, status: true, scheduledAt: true,
            startedAt: true, completedAt: true,
          },
        },
        school: { select: { id: true, name: true } },
      },
    });
    if (!record) throw new NotFoundException('Attendance record not found');
    return record;
  }

  async findByStudent(
    studentId: string,
    params: { page?: number; limit?: number; fromDate?: string; toDate?: string; startDate?: string; endDate?: string },
  ) {
    return this.findAll({ ...params, studentId });
  }

  async getTodayAttendance(schoolId: string, type?: TripType) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const where: Prisma.AttendanceWhereInput = {
      schoolId,
      date: { gte: today, lt: tomorrow },
    };
    if (type) where.type = type;

    const records = await this.prisma.attendance.findMany({
      where,
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true, studentId: true, grade: true, section: true },
        },
      },
    });

    const total = records.length;
    const present = records.filter((r) => r.status === 'PRESENT').length;
    const absent = records.filter((r) => r.status === 'ABSENT').length;
    const late = records.filter((r) => r.status === 'LATE').length;
    const excused = records.filter((r) => r.status === 'EXCUSED').length;

    const totalStudents = await this.prisma.student.count({
      where: { schoolId, isActive: true, deletedAt: null },
    });

    return {
      date: today,
      type: type || 'ALL',
      summary: { total, present, absent, late, excused },
      totalStudents,
      notMarked: totalStudents - total,
      records,
    };
  }

  async getMonthlyAttendance(schoolId: string, year: number, month: number) {
    if (month < 1 || month > 12) throw new BadRequestException('Month must be between 1 and 12');

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const records = await this.prisma.attendance.findMany({
      where: {
        schoolId,
        date: { gte: startDate, lte: endDate },
      },
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true, studentId: true, grade: true, section: true },
        },
      },
      orderBy: [{ date: 'asc' }, { student: { firstName: 'asc' } }],
    });

    const daysInMonth = endDate.getDate();
    const dailyBreakdown: Record<string, { present: number; absent: number; late: number; excused: number; total: number }> = {};

    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      dailyBreakdown[dateKey] = { present: 0, absent: 0, late: 0, excused: 0, total: 0 };
    }

    for (const record of records) {
      const dateStr = record.date.toISOString().split('T')[0];
      if (dailyBreakdown[dateStr]) {
        dailyBreakdown[dateStr].total++;
        dailyBreakdown[dateStr][record.status.toLowerCase() as 'present' | 'absent' | 'late' | 'excused']++;
      }
    }

    const totalPresent = records.filter((r) => r.status === 'PRESENT').length;
    const totalAbsent = records.filter((r) => r.status === 'ABSENT').length;
    const totalLate = records.filter((r) => r.status === 'LATE').length;
    const totalExcused = records.filter((r) => r.status === 'EXCUSED').length;

    return {
      year,
      month,
      schoolId,
      daysInMonth,
      summary: {
        total: records.length,
        present: totalPresent,
        absent: totalAbsent,
        late: totalLate,
        excused: totalExcused,
      },
      dailyBreakdown,
      records,
    };
  }

  async updateStatus(id: string, status: AttendanceStatus, notes?: string) {
    const record = await this.prisma.attendance.findUnique({ where: { id } });
    if (!record) throw new NotFoundException('Attendance record not found');

    return this.prisma.attendance.update({
      where: { id },
      data: { status, notes: notes !== undefined ? notes : record.notes },
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true, studentId: true },
        },
        trip: { select: { id: true, type: true } },
      },
    });
  }

  async create(data: {
    studentId: string; tripId?: string; schoolId: string; date: string;
    type: TripType; boardTime?: string; exitTime?: string;
    status?: AttendanceStatus; isLate?: boolean; lateMinutes?: number;
  }) {
    const createData: Record<string, unknown> = {
      ...data,
      date: new Date(data.date),
    };
    if (data.boardTime) createData.boardTime = new Date(data.boardTime);
    if (data.exitTime) createData.exitTime = new Date(data.exitTime);

    return this.prisma.attendance.create({
      data: createData as never,
      include: {
        student: { select: { id: true, firstName: true, lastName: true, studentId: true } },
        trip: { select: { id: true, type: true } },
      },
    });
  }

  async update(id: string, data: Partial<{
    boardTime: string; exitTime: string; status: AttendanceStatus;
    isLate: boolean; lateMinutes: number; notes: string;
  }>) {
    const record = await this.prisma.attendance.findUnique({ where: { id } });
    if (!record) throw new NotFoundException('Attendance record not found');

    const updateData: Record<string, unknown> = { ...data };
    if (data.boardTime) updateData.boardTime = new Date(data.boardTime);
    if (data.exitTime) updateData.exitTime = new Date(data.exitTime);

    return this.prisma.attendance.update({
      where: { id },
      data: updateData,
      include: {
        student: { select: { id: true, firstName: true, lastName: true, studentId: true } },
        trip: { select: { id: true, type: true, status: true } },
      },
    });
  }

  async softDelete(id: string): Promise<void> {
    const record = await this.prisma.attendance.findUnique({ where: { id } });
    if (!record) throw new NotFoundException('Attendance record not found');
    await this.prisma.attendance.delete({ where: { id } });
  }
}
