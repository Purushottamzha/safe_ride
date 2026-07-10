import { Injectable, Logger, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as fs from 'fs/promises';
import { createWriteStream } from 'fs';
import * as QRCode from 'qrcode';
import { ZipArchive } from 'archiver';
import { Response } from 'express';

const QR_STORAGE = path.resolve('storage/qrcodes');
const QR_PAYLOAD_VERSION = 1;

@Injectable()
export class QRManagementService {
  private readonly logger = new Logger(QRManagementService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    fs.mkdir(QR_STORAGE, { recursive: true }).catch(() => {});
  }

  async getDashboardStats(schoolId?: string) {
    const where: any = { deletedAt: null };
    if (schoolId) where.schoolId = schoolId;

    const [total, withQr, regeneratedToday] = await Promise.all([
      this.prisma.student.count({ where }),
      this.prisma.student.count({ where: { ...where, qrGeneratedAt: { not: null } } }),
      this.prisma.student.count({
        where: {
          ...where,
          qrGeneratedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
    ]);

    const lastGen = await this.prisma.student.findFirst({
      where: { ...where, qrGeneratedAt: { not: null } },
      orderBy: { qrGeneratedAt: 'desc' },
      select: { qrGeneratedAt: true },
    });

    return {
      totalStudents: total,
      qrGenerated: withQr,
      missingQr: total - withQr,
      regeneratedToday,
      lastGenerationTime: lastGen?.qrGeneratedAt || null,
    };
  }

  async getStudentQRInfo(studentId: string, schoolId?: string) {
    const student = await this.prisma.student.findUnique({
      where: { studentId },
      include: {
        school: { select: { name: true } },
        parentStudents: {
          include: { parent: { include: { user: { select: { firstName: true, lastName: true, phone: true } } } } },
        },
        studentAssignments: {
          include: { assignment: { include: { busAssignments: { include: { bus: { select: { busNumber: true } } } } } } },
        },
      },
    });
    if (!student || student.deletedAt) throw new NotFoundException('Student not found');
    if (schoolId && student.schoolId !== schoolId) throw new ForbiddenException('Access denied');

    const qrPath = student.qrImagePath ? path.join(QR_STORAGE, path.basename(student.qrImagePath)) : null;
    let qrExists = false;
    if (qrPath) {
      try { await fs.access(qrPath); qrExists = true; } catch { qrExists = false; }
    }

    const busNumber = student.studentAssignments?.[0]?.assignment?.busAssignments?.[0]?.bus?.busNumber || null;
    const emergencyContact = student.parentStudents?.[0]?.parent?.user?.phone || null;

    return {
      student,
      qrPayload: { version: QR_PAYLOAD_VERSION, studentId: student.studentId },
      qrExists,
      qrImagePath: student.qrImagePath,
      qrGeneratedAt: student.qrGeneratedAt,
      qrVersion: student.qrVersion,
      busNumber,
      emergencyContact,
    };
  }

  async generateQR(studentId: string, schoolId?: string, force = false) {
    const student = await this.prisma.student.findUnique({ where: { studentId } });
    if (!student || student.deletedAt) throw new NotFoundException('Student not found');
    if (schoolId && student.schoolId !== schoolId) throw new ForbiddenException('Access denied');

    if (!force && student.qrGeneratedAt && student.qrImagePath) {
      try {
        await fs.access(path.join(QR_STORAGE, path.basename(student.qrImagePath)));
        return { message: 'QR already exists', studentId, qrImagePath: student.qrImagePath };
      } catch {}
    }

    const payload = JSON.stringify({ version: QR_PAYLOAD_VERSION, studentId: student.studentId });
    const filename = `${student.studentId}.png`;
    const filepath = path.join(QR_STORAGE, filename);

    await QRCode.toFile(filepath, payload, {
      type: 'png',
      width: 400,
      margin: 2,
      color: { dark: '#1a1a2e', light: '#ffffff' },
    });

    const qrVersion = force ? student.qrVersion + 1 : student.qrVersion || 1;

    await this.prisma.student.update({
      where: { id: student.id },
      data: { qrGeneratedAt: new Date(), qrVersion, qrImagePath: filename, qrLastPrintedAt: student.qrLastPrintedAt },
    });

    return { message: force ? 'QR regenerated' : 'QR generated', studentId, qrImagePath: filename, qrVersion };
  }

  async bulkGenerate(
    filters: { grade?: string; section?: string; busId?: string; routeId?: string; schoolId?: string; studentIds?: string[] },
    schoolId?: string,
  ) {
    const where: any = { deletedAt: null };
    if (schoolId) where.schoolId = schoolId;
    if (filters.schoolId) where.schoolId = filters.schoolId;
    if (filters.grade) where.grade = filters.grade;
    if (filters.section) where.section = filters.section;
    if (filters.studentIds) where.studentId = { in: filters.studentIds };

    if (filters.busId || filters.routeId) {
      const assignmentWhere: any = { isActive: true };
      if (filters.busId) {
        assignmentWhere.busAssignments = { some: { busId: filters.busId } };
      }
      if (filters.routeId) {
        assignmentWhere.routeId = filters.routeId;
      }
      const assignments = await this.prisma.assignment.findMany({
        where: assignmentWhere,
        select: { id: true },
      });
      where.studentAssignments = { some: { assignmentId: { in: assignments.map(a => a.id) } } };
    }

    const students = await this.prisma.student.findMany({ where });
    let generated = 0;
    let skipped = 0;

    for (const student of students) {
      const payload = JSON.stringify({ version: QR_PAYLOAD_VERSION, studentId: student.studentId });
      const filename = `${student.studentId}.png`;
      const filepath = path.join(QR_STORAGE, filename);

      const exists = await fs.access(filepath).then(() => true).catch(() => false);
      if (exists && student.qrGeneratedAt) {
        skipped++;
        continue;
      }

      await QRCode.toFile(filepath, payload, { type: 'png', width: 400, margin: 2, color: { dark: '#1a1a2e', light: '#ffffff' } });

      await this.prisma.student.update({
        where: { id: student.id },
        data: { qrGeneratedAt: new Date(), qrVersion: student.qrVersion || 1, qrImagePath: filename },
      });
      generated++;
    }

    return { generated, skipped, total: students.length };
  }

  async downloadQR(studentId: string, schoolId: string | undefined, res: Response) {
    const student = await this.prisma.student.findUnique({ where: { studentId } });
    if (!student || student.deletedAt) throw new NotFoundException('Student not found');
    if (schoolId && student.schoolId !== schoolId) throw new ForbiddenException('Access denied');

    const filename = `${student.studentId}.png`;
    const filepath = path.join(QR_STORAGE, filename);

    try {
      await fs.access(filepath);
    } catch {
      throw new NotFoundException('QR not generated yet. Please generate first.');
    }

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    const stream = createWriteStream(filepath);
    const data = await fs.readFile(filepath);
    res.send(data);
  }

  async downloadBulkZip(
    filters: { grade?: string; section?: string; busId?: string; routeId?: string; schoolId?: string; studentIds?: string[] },
    schoolId: string | undefined,
    res: Response,
  ) {
    const where: any = { deletedAt: null, qrImagePath: { not: null } };
    if (schoolId) where.schoolId = schoolId;
    if (filters.grade) where.grade = filters.grade;
    if (filters.section) where.section = filters.section;
    if (filters.studentIds) where.studentId = { in: filters.studentIds };

    const students = await this.prisma.student.findMany({ where, select: { studentId: true, qrImagePath: true } });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="qrcodes.zip"');

    const archive = new ZipArchive({ zlib: { level: 6 } });
    archive.pipe(res);

    for (const student of students) {
      if (!student.qrImagePath) continue;
      const filepath = path.join(QR_STORAGE, path.basename(student.qrImagePath));
      try {
        await fs.access(filepath);
        archive.file(filepath, { name: `${student.studentId}.png` });
      } catch {}
    }

    await archive.finalize();
  }

  async getPrintableCard(studentId: string, schoolId?: string) {
    const info = await this.getStudentQRInfo(studentId, schoolId);
    const filename = `${info.student.studentId}.png`;
    const filepath = path.join(QR_STORAGE, filename);

    let qrBase64: string | null = null;
    try {
      const data = await fs.readFile(filepath);
      qrBase64 = data.toString('base64');
    } catch {
      throw new NotFoundException('QR not generated yet');
    }

    await this.prisma.student.update({
      where: { id: info.student.id },
      data: { qrLastPrintedAt: new Date() },
    });

    const emergencyContact = info.emergencyContact || 'Not provided';
    const busNumber = info.busNumber || 'Not assigned';
    const schoolName = info.student.school?.name || 'SafeRide Nepal';

    return {
      student: {
        studentId: info.student.studentId,
        firstName: info.student.firstName,
        lastName: info.student.lastName,
        grade: info.student.grade,
        section: info.student.section,
        profilePicture: info.student.profilePicture,
      },
      schoolName,
      busNumber,
      emergencyContact,
      qrBase64: `data:image/png;base64,${qrBase64}`,
    };
  }

  async getPrintableCards(
    filters: { grade?: string; section?: string; busId?: string; schoolId?: string; studentIds?: string[] },
    schoolId: string | undefined,
  ) {
    const where: any = { deletedAt: null, qrImagePath: { not: null } };
    if (schoolId) where.schoolId = schoolId;
    if (filters.grade) where.grade = filters.grade;
    if (filters.section) where.section = filters.section;
    if (filters.studentIds) where.studentId = { in: filters.studentIds };

    const students = await this.prisma.student.findMany({
      where,
      include: {
        school: { select: { name: true } },
        parentStudents: { include: { parent: { include: { user: { select: { phone: true } } } } } },
        studentAssignments: {
          include: { assignment: { include: { busAssignments: { include: { bus: { select: { busNumber: true } } } } } } },
        },
      },
    });

    const cards = [];
    for (const student of students) {
      const filename = `${student.studentId}.png`;
      const filepath = path.join(QR_STORAGE, filename);
      let qrBase64: string | null = null;
      try {
        const data = await fs.readFile(filepath);
        qrBase64 = data.toString('base64');
      } catch { continue; }

      cards.push({
        studentId: student.studentId,
        firstName: student.firstName,
        lastName: student.lastName,
        grade: student.grade,
        section: student.section,
        schoolName: student.school?.name || 'SafeRide Nepal',
        busNumber: student.studentAssignments?.[0]?.assignment?.busAssignments?.[0]?.bus?.busNumber || 'N/A',
        emergencyContact: student.parentStudents?.[0]?.parent?.user?.phone || 'N/A',
        qrImage: `data:image/png;base64,${qrBase64}`,
      });
    }

    return cards;
  }
}
