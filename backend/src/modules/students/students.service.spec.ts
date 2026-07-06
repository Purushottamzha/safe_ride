import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { StudentsService } from './students.service';
import { PrismaService } from '../../database/prisma.service';

describe('StudentsService', () => {
  let service: StudentsService;
  let prisma: any;

  const mockStudent = {
    id: 'student-1',
    firstName: 'Ram',
    lastName: 'Sharma',
    dateOfBirth: new Date('2012-01-01'),
    grade: '5',
    section: 'A',
    studentId: 'STU-ABC123',
    qrToken: 'qr-token-hex',
    qrExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    isActive: true,
    address: 'Kathmandu',
    phone: '+977-9841234567',
    schoolId: 'school-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    school: { id: 'school-1', name: 'Test School' },
    parentStudents: [],
    studentAssignments: [],
  };

  beforeEach(async () => {
    prisma = {
      student: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<StudentsService>(StudentsService);
  });

  describe('findAll', () => {
    it('should return paginated results', async () => {
      const students = [mockStudent];
      prisma.student.findMany.mockResolvedValue(students);
      prisma.student.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10, schoolId: 'school-1' });

      expect(result.data).toEqual(students);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
      expect(result.meta.hasNextPage).toBe(false);
    });
  });

  describe('findById', () => {
    it('should return student with relations', async () => {
      prisma.student.findFirst.mockResolvedValue(mockStudent);

      const result = await service.findById('student-1');

      expect(result).toEqual(mockStudent);
      expect(prisma.student.findFirst).toHaveBeenCalledWith({
        where: { id: 'student-1', deletedAt: null },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException for non-existent student', async () => {
      prisma.student.findFirst.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should generate studentId and qrToken', async () => {
      const createData = {
        firstName: 'New',
        lastName: 'Student',
        dateOfBirth: '2012-06-15',
        grade: '4',
        address: 'Patan',
        schoolId: 'school-1',
      };

      prisma.student.create.mockImplementation(async (args: any) => ({
        ...mockStudent,
        ...args.data,
        dateOfBirth: new Date(args.data.dateOfBirth),
      }));

      const result = await service.create(createData);

      expect(result.studentId).toBeDefined();
      expect(result.studentId).toContain('STU-');
      expect(result.qrToken).toBeDefined();
      expect(result.qrToken.length).toBe(64);
      expect(result.qrExpiresAt).toBeDefined();
    });
  });

  describe('update', () => {
    it('should modify student data', async () => {
      prisma.student.findFirst.mockResolvedValue(mockStudent);
      prisma.student.update.mockResolvedValue({ ...mockStudent, firstName: 'Updated', lastName: 'Name' });

      const result = await service.update('student-1', { firstName: 'Updated', lastName: 'Name' });

      expect(result.firstName).toBe('Updated');
      expect(result.lastName).toBe('Name');
    });
  });

  describe('softDelete', () => {
    it('should set deletedAt', async () => {
      prisma.student.findFirst.mockResolvedValue(mockStudent);
      prisma.student.update.mockResolvedValue({ ...mockStudent, deletedAt: new Date(), isActive: false });

      await service.softDelete('student-1');

      expect(prisma.student.update).toHaveBeenCalledWith({
        where: { id: 'student-1' },
        data: { deletedAt: expect.any(Date), isActive: false },
      });
    });
  });
});
