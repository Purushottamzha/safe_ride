import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { MaintenanceType, MaintenancePriority, ServiceStatus, InspectionResult, FuelType, DocumentType, Prisma } from '@prisma/client';

@Injectable()
export class MaintenanceService {
  constructor(private prisma: PrismaService) {}

  async getVehicleHealth(schoolId?: string) {
    const buses = await this.prisma.bus.findMany({
      where: {
        ...(schoolId ? { schoolId } : {}),
        deletedAt: null,
      },
      include: {
        maintenanceRecords: {
          orderBy: { completedAt: 'desc' },
          take: 5,
        },
        serviceSchedules: {
          where: { status: { not: 'COMPLETED' } },
          orderBy: { scheduledAt: 'asc' },
        },
        inspections: {
          orderBy: { date: 'desc' },
          take: 1,
        },
      },
    });

    return buses.map(bus => {
      const recentMaintenance = bus.maintenanceRecords.filter(m => m.status === 'COMPLETED');
      const hasActiveIssue = bus.maintenanceRecords.some(m => m.status === 'IN_PROGRESS' || m.priority === 'CRITICAL');
      const lastService = recentMaintenance[0];
      const hasEngineIssue = bus.maintenanceRecords.some(m => m.type === 'ENGINE_SERVICE' && m.status === 'IN_PROGRESS');
      const hasBrakeIssue = bus.maintenanceRecords.some(m => m.type === 'BRAKE_SERVICE' && m.status === 'IN_PROGRESS');
      const hasTyreIssue = bus.maintenanceRecords.some(m => m.type === 'TYRE_REPLACEMENT' && m.status === 'IN_PROGRESS');

      const maintenanceCount = recentMaintenance.length;
      const healthScore = Math.min(100, Math.max(10,
        100
        - (hasActiveIssue ? 25 : 0)
        - (hasEngineIssue ? 10 : 0)
        - (hasBrakeIssue ? 10 : 0)
        - (hasTyreIssue ? 10 : 0)
        - (bus.maintenanceRecords.filter(m => m.priority === 'CRITICAL').length * 15)
        - (bus.maintenanceRecords.filter(m => m.priority === 'HIGH').length * 5)
      ));

      return {
        id: bus.id,
        busNumber: bus.busNumber,
        plateNumber: bus.plateNumber,
        healthScore,
        lastServiceDate: lastService?.completedAt || bus.createdAt,
        nextServiceDate: bus.serviceSchedules[0]?.scheduledAt || null,
        odometer: 0,
        tirePressure: hasTyreIssue ? 'critical' as const : 'good' as const,
        brakeHealth: hasBrakeIssue ? 'critical' as const : 'good' as const,
        engineHealth: hasEngineIssue ? 'critical' as const : 'good' as const,
        hasActiveIssue,
      };
    });
  }

  async getServiceSchedules(schoolId?: string) {
    const schedules = await this.prisma.serviceSchedule.findMany({
      where: schoolId ? { schoolId } : {},
      include: { bus: { select: { busNumber: true, plateNumber: true } } },
      orderBy: { scheduledAt: 'asc' },
    });

    return schedules.map(s => ({
      id: s.id,
      busNumber: s.bus.busNumber,
      plateNumber: s.bus.plateNumber,
      serviceType: s.type,
      scheduledDate: s.scheduledAt,
      status: s.status,
      notes: s.notes,
    }));
  }

  async getInspections(schoolId?: string) {
    const inspections = await this.prisma.inspection.findMany({
      where: schoolId ? { schoolId } : {},
      include: { bus: { select: { busNumber: true, plateNumber: true } } },
      orderBy: { date: 'desc' },
    });

    return inspections.map(i => ({
      id: i.id,
      busNumber: i.bus.busNumber,
      plateNumber: i.bus.plateNumber,
      date: i.date,
      inspector: i.inspectorName,
      result: i.result,
      notes: i.notes,
    }));
  }

  // ── Maintenance Records ──────────────────────────────────────────────

  async createMaintenance(data: {
    busId: string; schoolId: string; type: MaintenanceType; description: string;
    priority?: MaintenancePriority; scheduledAt?: string; cost?: number; vendor?: string; notes?: string;
  }) {
    return this.prisma.maintenanceRecord.create({
      data: {
        busId: data.busId, schoolId: data.schoolId, type: data.type, description: data.description,
        priority: data.priority || 'MEDIUM', scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
        cost: data.cost, vendor: data.vendor, notes: data.notes,
      },
    });
  }

  async getMaintenanceRecords(schoolId?: string, busId?: string) {
    const where: Prisma.MaintenanceRecordWhereInput = {};
    if (schoolId) where.schoolId = schoolId;
    if (busId) where.busId = busId;
    return this.prisma.maintenanceRecord.findMany({
      where,
      include: { bus: { select: { busNumber: true, plateNumber: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateMaintenanceStatus(id: string, status: ServiceStatus) {
    const record = await this.prisma.maintenanceRecord.findUnique({ where: { id } });
    if (!record) throw new NotFoundException('Maintenance record not found');
    return this.prisma.maintenanceRecord.update({
      where: { id },
      data: { status, completedAt: status === 'COMPLETED' ? new Date() : undefined },
    });
  }

  // ── Service Schedules ────────────────────────────────────────────────

  async createServiceSchedule(data: {
    busId: string; schoolId: string; type: MaintenanceType; description: string;
    scheduledAt: string; assignedTo?: string; notes?: string;
  }) {
    return this.prisma.serviceSchedule.create({
      data: {
        busId: data.busId, schoolId: data.schoolId, type: data.type, description: data.description,
        scheduledAt: new Date(data.scheduledAt), assignedTo: data.assignedTo, notes: data.notes,
      },
    });
  }

  async updateServiceScheduleStatus(id: string, status: ServiceStatus) {
    const record = await this.prisma.serviceSchedule.findUnique({ where: { id } });
    if (!record) throw new NotFoundException('Service schedule not found');
    return this.prisma.serviceSchedule.update({ where: { id }, data: { status } });
  }

  // ── Inspections ──────────────────────────────────────────────────────

  async createInspection(data: {
    busId: string; schoolId: string; inspectorName: string; date: string;
    result?: InspectionResult; notes?: string; nextInspectionDate?: string;
  }) {
    return this.prisma.inspection.create({
      data: {
        busId: data.busId, schoolId: data.schoolId, inspectorName: data.inspectorName,
        date: new Date(data.date), result: data.result || 'PENDING', notes: data.notes,
        nextInspectionDate: data.nextInspectionDate ? new Date(data.nextInspectionDate) : null,
      },
    });
  }

  async updateInspectionResult(id: string, result: InspectionResult, notes?: string) {
    const record = await this.prisma.inspection.findUnique({ where: { id } });
    if (!record) throw new NotFoundException('Inspection not found');
    return this.prisma.inspection.update({ where: { id }, data: { result, notes } });
  }

  // ── Fuel Logs ────────────────────────────────────────────────────────

  async createFuelLog(data: {
    busId: string; schoolId: string; liters: number; costPerLiter: number;
    totalCost: number; odometer?: number; fuelType?: FuelType; station?: string; notes?: string;
  }) {
    return this.prisma.fuelLog.create({ data });
  }

  async getFuelLogs(schoolId?: string, busId?: string) {
    const where: Prisma.FuelLogWhereInput = {};
    if (schoolId) where.schoolId = schoolId;
    if (busId) where.busId = busId;
    return this.prisma.fuelLog.findMany({
      where,
      include: { bus: { select: { busNumber: true, plateNumber: true } } },
      orderBy: { date: 'desc' },
    });
  }

  // ── Insurance Policies ───────────────────────────────────────────────

  async createInsurancePolicy(data: {
    busId: string; schoolId: string; provider: string; policyNumber: string;
    startDate: string; expiryDate: string; coverage?: string; premium?: number; notes?: string;
  }) {
    return this.prisma.insurancePolicy.create({
      data: {
        busId: data.busId, schoolId: data.schoolId, provider: data.provider,
        policyNumber: data.policyNumber, startDate: new Date(data.startDate),
        expiryDate: new Date(data.expiryDate), coverage: data.coverage,
        premium: data.premium, notes: data.notes,
      },
    });
  }

  async getInsurancePolicies(schoolId?: string) {
    return this.prisma.insurancePolicy.findMany({
      where: schoolId ? { schoolId } : {},
      include: { bus: { select: { id: true, busNumber: true, plateNumber: true } } },
      orderBy: { expiryDate: 'asc' },
    });
  }

  // ── Vehicle Documents ────────────────────────────────────────────────

  async createVehicleDocument(data: {
    busId: string; schoolId: string; type: DocumentType;
    documentNumber?: string; issueDate?: string; expiryDate?: string; fileUrl?: string; notes?: string;
  }) {
    return this.prisma.vehicleDocument.create({
      data: {
        busId: data.busId, schoolId: data.schoolId, type: data.type,
        documentNumber: data.documentNumber,
        issueDate: data.issueDate ? new Date(data.issueDate) : null,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        fileUrl: data.fileUrl, notes: data.notes,
      },
    });
  }

  async getVehicleDocuments(schoolId?: string) {
    return this.prisma.vehicleDocument.findMany({
      where: schoolId ? { schoolId } : {},
      include: { bus: { select: { id: true, busNumber: true, plateNumber: true } } },
      orderBy: { expiryDate: 'asc' },
    });
  }

  // ── Service Reminders ────────────────────────────────────────────────

  async getServiceReminders(schoolId?: string) {
    return this.prisma.serviceReminder.findMany({
      where: { ...(schoolId ? { schoolId } : {}), isActive: true },
      include: { bus: { select: { id: true, busNumber: true, plateNumber: true } } },
      orderBy: { dueDate: 'asc' },
    });
  }

  // ── Fleet Dashboard ──────────────────────────────────────────────────

  async getFleetDashboard(schoolId?: string) {
    const now = new Date();
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const where = schoolId ? { schoolId } : {};

    const [
      buses, activeMaintenance, upcomingServices, expiringInsurance,
      expiringDocuments, totalFuelSpend, activeReminders,
    ] = await Promise.all([
      this.prisma.bus.count({ where: { ...where, deletedAt: null } }),
      this.prisma.maintenanceRecord.count({ where: { ...where, status: { in: ['IN_PROGRESS', 'SCHEDULED'] } } }),
      this.prisma.serviceSchedule.count({ where: { ...where, scheduledAt: { lte: thirtyDays }, status: { not: 'COMPLETED' } } }),
      this.prisma.insurancePolicy.count({ where: { ...where, expiryDate: { lte: thirtyDays, gte: now } } }),
      this.prisma.vehicleDocument.count({ where: { ...where, expiryDate: { lte: thirtyDays, gte: now } } }),
      this.prisma.fuelLog.aggregate({ where: where, _sum: { totalCost: true } }),
      this.prisma.serviceReminder.count({ where: { ...where, isActive: true, dueDate: { lte: thirtyDays } } }),
    ]);

    return {
      totalBuses: buses,
      activeMaintenance,
      upcomingServices,
      expiringInsurance,
      expiringDocuments,
      totalFuelCost: totalFuelSpend._sum.totalCost || 0,
      activeReminders,
    };
  }
}
