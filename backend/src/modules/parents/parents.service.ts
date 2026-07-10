import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma, UserRole } from '@prisma/client';

@Injectable()
export class ParentsService {
  constructor(private prisma: PrismaService) {}

  async getMyChildren(userId: string) {
    const parent = await this.prisma.parent.findUnique({
      where: { userId },
      include: {
        studentParents: {
          include: {
            student: {
              include: {
                school: { select: { id: true, name: true } },
                studentAssignments: {
                  where: { isActive: true },
                  include: {
                    assignment: {
                      include: {
                        route: { select: { id: true, name: true } },
                        busAssignments: {
                          where: { isPrimary: true },
                          include: {
                            bus: { select: { id: true, plateNumber: true, busNumber: true, model: true, color: true, capacity: true, status: true } },
                          },
                        },
                        driverAssignments: {
                          where: { isPrimary: true },
                          include: {
                            driver: {
                              include: {
                                user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
                              },
                            },
                          },
                        },
                      },
                    },
                    stop: { select: { id: true, name: true, address: true } },
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!parent) throw new ForbiddenException('Parent profile not found');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const children = await Promise.all(
      parent.studentParents.map(async (sp) => {
        const student = sp.student;
        const activeAssignment = student.studentAssignments[0];
        const busInfo = activeAssignment?.assignment?.busAssignments[0]?.bus || null;
        const driverInfo = activeAssignment?.assignment?.driverAssignments[0]?.driver || null;

        const todayAttendance = await this.prisma.attendance.findFirst({
          where: {
            studentId: student.id,
            date: { gte: today, lt: tomorrow },
          },
          orderBy: { createdAt: 'desc' },
          include: { trip: { select: { id: true, status: true, type: true, scheduledAt: true, startedAt: true } } },
        });

        let status: string;
        let message: string;

        if (todayAttendance) {
          const attStatus = todayAttendance.status;
          if (attStatus === 'PRESENT') {
            if (todayAttendance.exitTime) {
              status = 'present';
              message = 'Completed for today';
            } else if (todayAttendance.boardTime) {
              status = 'present';
              message = todayAttendance.trip?.status === 'ACTIVE' ? 'On the way to school' : 'Boarded the bus';
            } else {
              status = 'present';
              message = 'Marked present';
            }
          } else if (attStatus === 'LATE') {
            status = 'late';
            message = `Arrived ${todayAttendance.lateMinutes} min late`;
          } else if (attStatus === 'ABSENT') {
            status = 'absent';
            message = 'Absent today';
          } else if (attStatus === 'EXCUSED') {
            status = 'absent';
            message = 'Excused absence';
          } else {
            status = 'unknown';
            message = 'Status pending';
          }
        } else {
          status = 'unknown';
          message = 'Not yet marked';
        }

        const mapTripStatus = (s: string | null | undefined) => {
          if (!s) return null;
          const map: Record<string, string> = { SCHEDULED: 'PENDING', ACTIVE: 'IN_TRANSIT', COMPLETED: 'COMPLETED', CANCELLED: 'CANCELLED' };
          return map[s] || s;
        };

        return {
          id: student.id,
          name: `${student.firstName} ${student.lastName}`,
          firstName: student.firstName,
          lastName: student.lastName,
          grade: student.grade,
          section: student.section,
          school: student.school.name,
          schoolId: student.schoolId,
          photoUrl: student.profilePicture,
          studentId: student.studentId,
          todayStatus: {
            studentId: student.id,
            date: today.toISOString(),
            status,
            currentTripStatus: mapTripStatus(todayAttendance?.trip?.status),
            currentDirection: todayAttendance?.trip?.type === 'MORNING' ? 'TO_SCHOOL' : todayAttendance?.trip?.type === 'AFTERNOON' ? 'FROM_SCHOOL' : null,
            lastScanTime: todayAttendance?.boardTime?.toISOString() || null,
            lastScanLocation: null,
            message,
          },
          bus: busInfo ? {
            id: busInfo.id,
            plateNumber: busInfo.plateNumber,
            busNumber: busInfo.busNumber,
            model: busInfo.model,
            color: busInfo.color,
            status: busInfo.status,
          } : null,
          driver: driverInfo ? {
            id: driverInfo.id,
            name: `${driverInfo.user.firstName} ${driverInfo.user.lastName}`,
            phone: driverInfo.user.phone,
            email: driverInfo.user.email,
          } : null,
          route: activeAssignment?.assignment?.route ? {
            id: activeAssignment.assignment.route.id,
            name: activeAssignment.assignment.route.name,
          } : null,
          stop: activeAssignment?.stop ? {
            id: activeAssignment.stop.id,
            name: activeAssignment.stop.name,
            address: activeAssignment.stop.address,
          } : null,
        };
      }),
    );

    return children;
  }

  async findAll(params: { page?: number; limit?: number; search?: string; schoolId?: string }) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.ParentWhereInput = { deletedAt: null };
    if (params.search) {
      where.OR = [
        { user: { firstName: { contains: params.search, mode: 'insensitive' } } },
        { user: { lastName: { contains: params.search, mode: 'insensitive' } } },
        { user: { email: { contains: params.search, mode: 'insensitive' } } },
      ];
    }
    if (params.schoolId)
      where.user = {
        ...((where.user as Record<string, unknown>) || {}),
        schoolId: params.schoolId,
      };

    const [data, total] = await Promise.all([
      this.prisma.parent.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              role: true,
              status: true,
            },
          },
          studentParents: {
            include: {
              student: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  studentId: true,
                  grade: true,
                  section: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.parent.count({ where }),
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
    const parent = await this.prisma.parent.findFirst({
      where: { id, deletedAt: null },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            role: true,
            status: true,
            profilePicture: true,
          },
        },
        studentParents: {
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                studentId: true,
                grade: true,
                section: true,
              },
            },
          },
        },
      },
    });
    if (!parent) throw new NotFoundException('Parent not found');
    return parent;
  }

  async create(data: { userId: string; emergencyContact?: boolean }) {
    const existing = await this.prisma.parent.findUnique({ where: { userId: data.userId } });
    if (existing) throw new ConflictException('Parent already exists for this user');

    return this.prisma.parent.create({
      data,
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
  }

  async update(id: string, data: { firstName?: string; lastName?: string; phone?: string; emergencyContact?: boolean }) {
    const parent = await this.prisma.parent.findFirst({ where: { id, deletedAt: null } });
    if (!parent) throw new NotFoundException('Parent not found');
    const { firstName, lastName, phone, ...parentData } = data;
    if (firstName || lastName || phone) {
      await this.prisma.user.update({
        where: { id: parent.userId },
        data: { ...(firstName && { firstName }), ...(lastName && { lastName }), ...(phone && { phone }) },
      });
    }
    return this.prisma.parent.update({
      where: { id },
      data: parentData,
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true } },
        studentParents: {
          include: {
            student: { select: { id: true, firstName: true, lastName: true, studentId: true, grade: true } },
          },
        },
      },
    });
  }

  async linkStudent(parentId: string, studentId: string, relation: string, isPrimary?: boolean) {
    const parent = await this.prisma.parent.findFirst({ where: { id: parentId, deletedAt: null } });
    if (!parent) throw new NotFoundException('Parent not found');

    const student = await this.prisma.student.findFirst({
      where: { id: studentId, deletedAt: null },
    });
    if (!student) throw new NotFoundException('Student not found');

    return this.prisma.studentParent.create({
      data: { parentId, studentId, relation, isPrimary: isPrimary ?? false },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, studentId: true } },
        parent: { include: { user: { select: { id: true, firstName: true, lastName: true } } } },
      },
    });
  }

  async unlinkStudent(parentId: string, studentId: string) {
    const link = await this.prisma.studentParent.findUnique({
      where: { studentId_parentId: { studentId, parentId } },
    });
    if (!link) throw new NotFoundException('Parent-student link not found');

    await this.prisma.studentParent.delete({
      where: { studentId_parentId: { studentId, parentId } },
    });
  }

  async softDelete(id: string): Promise<void> {
    const parent = await this.prisma.parent.findFirst({ where: { id, deletedAt: null } });
    if (!parent) throw new NotFoundException('Parent not found');
    await this.prisma.parent.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
