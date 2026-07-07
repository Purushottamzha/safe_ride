import { Test, TestingModule } from '@nestjs/testing';
import { AttendanceService } from './attendance.service';
import { PrismaService } from '../../database/prisma.service';
import { AttendanceStatus, TripType } from '@prisma/client';

describe('AttendanceService', () => {
  let service: AttendanceService;
  let prisma: any;

  const mockRecord = {
    id: 'att-1',
    studentId: 'student-1',
    tripId: 'trip-1',
    schoolId: 'school-1',
    date: new Date('2026-01-15'),
    type: TripType.MORNING,
    boardTime: new Date('2026-01-15T07:00:00Z'),
    exitTime: null,
    status: AttendanceStatus.PRESENT,
    isLate: false,
    lateMinutes: 0,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    student: {
      id: 'student-1',
      firstName: 'Ram',
      lastName: 'Sharma',
      studentId: 'STU-001',
      grade: '5',
      section: 'A',
    },
    trip: {
      id: 'trip-1',
      type: TripType.MORNING,
      status: 'ACTIVE',
      scheduledAt: new Date('2026-01-15T07:00:00Z'),
    },
    school: { id: 'school-1', name: 'Test School' },
  };

  beforeEach(async () => {
    prisma = {
      attendance: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn(),
      },
      student: {
        count: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [AttendanceService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<AttendanceService>(AttendanceService);
  });

  describe('getTodayAttendance', () => {
    it('should return attendance stats', async () => {
      const records = [
        { ...mockRecord, status: AttendanceStatus.PRESENT },
        { ...mockRecord, id: 'att-2', status: AttendanceStatus.ABSENT },
        {
          ...mockRecord,
          id: 'att-3',
          status: AttendanceStatus.LATE,
          isLate: true,
          lateMinutes: 10,
        },
      ];

      prisma.attendance.findMany.mockResolvedValue(records);
      prisma.student.count.mockResolvedValue(50);

      const result = await service.getTodayAttendance('school-1');

      expect(result.summary.total).toBe(3);
      expect(result.summary.present).toBe(1);
      expect(result.summary.absent).toBe(1);
      expect(result.summary.late).toBe(1);
      expect(result.totalStudents).toBe(50);
      expect(result.notMarked).toBe(47);
    });
  });

  describe('getMonthlyAttendance', () => {
    it('should return daily breakdown', async () => {
      const records = [
        { ...mockRecord, date: new Date('2026-01-01') },
        {
          ...mockRecord,
          id: 'att-2',
          date: new Date('2026-01-01'),
          status: AttendanceStatus.ABSENT,
        },
        {
          ...mockRecord,
          id: 'att-3',
          date: new Date('2026-01-02'),
          status: AttendanceStatus.LATE,
          isLate: true,
        },
      ];

      prisma.attendance.findMany.mockResolvedValue(records);

      const result = await service.getMonthlyAttendance('school-1', 2026, 1);

      expect(result.year).toBe(2026);
      expect(result.month).toBe(1);
      expect(result.daysInMonth).toBe(31);
      expect(result.summary.total).toBe(3);
      expect(result.dailyBreakdown).toBeDefined();
      expect(Object.keys(result.dailyBreakdown).length).toBe(31);
    });
  });
});
