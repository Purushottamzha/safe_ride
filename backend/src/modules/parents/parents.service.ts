import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ParentsService {
  constructor(private prisma: PrismaService) {}

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
    if (params.schoolId) where.user = { ...(where.user as Record<string, unknown> || {}), schoolId: params.schoolId };

    const [data, total] = await Promise.all([
      this.prisma.parent.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, email: true, firstName: true, lastName: true, phone: true, role: true, status: true },
          },
          studentParents: {
            include: {
              student: { select: { id: true, firstName: true, lastName: true, studentId: true, grade: true, section: true } },
            },
          },
        },
      }),
      this.prisma.parent.count({ where }),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit), hasNextPage: page * limit < total, hasPreviousPage: page > 1 },
    };
  }

  async findById(id: string) {
    const parent = await this.prisma.parent.findFirst({
      where: { id, deletedAt: null },
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true, phone: true, role: true, status: true, profilePicture: true },
        },
        studentParents: {
          include: {
            student: { select: { id: true, firstName: true, lastName: true, studentId: true, grade: true, section: true } },
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

  async update(id: string, data: { emergencyContact?: boolean }) {
    const parent = await this.prisma.parent.findFirst({ where: { id, deletedAt: null } });
    if (!parent) throw new NotFoundException('Parent not found');
    return this.prisma.parent.update({ where: { id }, data });
  }

  async linkStudent(parentId: string, studentId: string, relation: string, isPrimary?: boolean) {
    const parent = await this.prisma.parent.findFirst({ where: { id: parentId, deletedAt: null } });
    if (!parent) throw new NotFoundException('Parent not found');

    const student = await this.prisma.student.findFirst({ where: { id: studentId, deletedAt: null } });
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
