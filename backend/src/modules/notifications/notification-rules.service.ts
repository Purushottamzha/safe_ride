import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { NotificationGateway } from './notification.gateway';
import { NotificationsService } from './notifications.service';
import { NotificationPreferencesService } from './notification-preferences.service';
import { NotificationType, NotificationChannel } from '@prisma/client';

interface TripEventPayload {
  tripId: string;
  tripType: string;
  tripStatus: string;
  schoolId: string;
  busNumber?: string;
  driverName?: string;
  direction?: string;
}

interface StudentEventPayload {
  studentId: string;
  studentName: string;
  parentUserIds: string[];
  tripId: string;
  schoolId: string;
  isLate?: boolean;
  lateMinutes?: number;
}

interface BusProximityPayload {
  stopName: string;
  stopId: string;
  distance: number;
  parentUserIds: string[];
  tripId: string;
  schoolId: string;
}

@Injectable()
export class NotificationRulesService {
  constructor(
    private prisma: PrismaService,
    private notificationGateway: NotificationGateway,
    private notificationsService: NotificationsService,
    private preferencesService: NotificationPreferencesService,
  ) {}

  async handleTripStarted(payload: TripEventPayload) {
    const userIds = await this.getParentUserIdsForTrip(payload.tripId);
    const enabledUsers = await this.preferencesService.getEnabledUsersForEvent(
      userIds, 'TRIP_STARTED',
    );

    for (const userId of enabledUsers) {
      const body = `The ${payload.direction === 'TO_SCHOOL' ? 'morning' : 'afternoon'} trip has started. Bus ${payload.busNumber || ''} is on the way.`;
      await this.deliver(userId, payload.schoolId, {
        type: NotificationType.TRIP_UPDATE,
        title: 'Trip Started',
        body,
        eventType: 'TRIP_STARTED',
        data: { tripId: payload.tripId, tripType: payload.tripType, direction: payload.direction },
      });
    }
  }

  async handleBusApproaching(payload: BusProximityPayload) {
    const enabledUsers = await this.preferencesService.getEnabledUsersForEvent(
      payload.parentUserIds, 'BUS_APPROACHING',
    );

    for (const userId of enabledUsers) {
      const body = `Bus is approaching ${payload.stopName} (${Math.round(payload.distance)}m away).`;
      await this.deliver(userId, payload.schoolId, {
        type: NotificationType.TRIP_UPDATE,
        title: `Bus Approaching ${payload.stopName}`,
        body,
        eventType: 'BUS_APPROACHING',
        data: { stopName: payload.stopName, stopId: payload.stopId, distance: payload.distance, tripId: payload.tripId },
      });
    }
  }

  async handleStudentBoarded(payload: StudentEventPayload) {
    const enabledUsers = await this.preferencesService.getEnabledUsersForEvent(
      payload.parentUserIds, 'STUDENT_BOARDED',
    );

    for (const userId of enabledUsers) {
      const lateSuffix = payload.isLate ? ` (${payload.lateMinutes} min late)` : '';
      const body = `${payload.studentName} has boarded the bus.${lateSuffix}`;
      await this.deliver(userId, payload.schoolId, {
        type: NotificationType.ATTENDANCE,
        title: payload.isLate ? 'Student Boarded (Late)' : 'Student Boarded',
        body,
        eventType: 'STUDENT_BOARDED',
        data: { studentId: payload.studentId, studentName: payload.studentName, tripId: payload.tripId, isLate: payload.isLate, lateMinutes: payload.lateMinutes },
      });
    }
  }

  async handleStudentExited(payload: StudentEventPayload) {
    const enabledUsers = await this.preferencesService.getEnabledUsersForEvent(
      payload.parentUserIds, 'STUDENT_EXITED',
    );

    for (const userId of enabledUsers) {
      const body = `${payload.studentName} has exited the bus.`;
      await this.deliver(userId, payload.schoolId, {
        type: NotificationType.ATTENDANCE,
        title: 'Student Exited',
        body,
        eventType: 'STUDENT_EXITED',
        data: { studentId: payload.studentId, studentName: payload.studentName, tripId: payload.tripId },
      });
    }
  }

  async handleStudentAbsent(payload: StudentEventPayload) {
    const parentEnabledUsers = await this.preferencesService.getEnabledUsersForEvent(
      payload.parentUserIds, 'STUDENT_ABSENT',
    );

    for (const userId of parentEnabledUsers) {
      const body = `${payload.studentName} was marked absent for today's trip.`;
      await this.deliver(userId, payload.schoolId, {
        type: NotificationType.ATTENDANCE,
        title: 'Student Absent',
        body,
        eventType: 'STUDENT_ABSENT',
        data: { studentId: payload.studentId, studentName: payload.studentName, tripId: payload.tripId },
      });
    }

    const schoolAdmins = await this.getSchoolAdminUserIds(payload.schoolId);
    for (const userId of schoolAdmins) {
      await this.deliver(userId, payload.schoolId, {
        type: NotificationType.ATTENDANCE,
        title: 'Student Absent - Alert',
        body: `${payload.studentName} was absent after the bus departed.`,
        eventType: 'STUDENT_ABSENT',
        data: { studentId: payload.studentId, studentName: payload.studentName, tripId: payload.tripId },
      });
    }
  }

  async handleTripCompleted(payload: TripEventPayload) {
    const userIds = await this.getParentUserIdsForTrip(payload.tripId);
    const enabledUsers = await this.preferencesService.getEnabledUsersForEvent(
      userIds, 'TRIP_COMPLETED',
    );

    for (const userId of enabledUsers) {
      const body = `The ${payload.direction === 'TO_SCHOOL' ? 'morning' : 'afternoon'} trip has been completed.`;
      await this.deliver(userId, payload.schoolId, {
        type: NotificationType.TRIP_UPDATE,
        title: 'Trip Completed',
        body,
        eventType: 'TRIP_COMPLETED',
        data: { tripId: payload.tripId, tripType: payload.tripType },
      });
    }
  }

  async handleRouteDeviation(params: {
    tripId: string;
    schoolId: string;
    deviationMeters: number;
  }) {
    const adminUserIds = await this.getSchoolAdminUserIds(params.schoolId);

    for (const userId of adminUserIds) {
      await this.deliver(userId, params.schoolId, {
        type: NotificationType.INCIDENT,
        title: 'Route Deviation Detected',
        body: `Bus on trip ${params.tripId.slice(0, 8)} deviated ${Math.round(params.deviationMeters)}m from the route.`,
        eventType: 'ROUTE_DEVIATION',
        data: { tripId: params.tripId, deviationMeters: params.deviationMeters },
      });
    }

    if (params.deviationMeters > 300) {
      const parentIds = await this.getParentUserIdsForTrip(params.tripId);
      const enabledUsers = await this.preferencesService.getEnabledUsersForEvent(
        parentIds, 'ROUTE_DEVIATION',
      );
      for (const userId of enabledUsers) {
        await this.deliver(userId, params.schoolId, {
          type: NotificationType.EMERGENCY,
          title: 'Route Deviation Alert',
          body: `Your child's bus has deviated significantly from its route. Admin has been notified.`,
          eventType: 'ROUTE_DEVIATION',
          data: { tripId: params.tripId, deviationMeters: params.deviationMeters },
        });
      }
    }
  }

  private async deliver(
    userId: string,
    schoolId: string | undefined,
    opts: {
      type: NotificationType;
      title: string;
      body: string;
      eventType: string;
      data?: Record<string, unknown>;
    },
  ) {
    await this.notificationsService.create({
      type: opts.type,
      channel: NotificationChannel.IN_APP,
      title: opts.title,
      body: opts.body,
      data: opts.data,
      userId,
      schoolId,
    });
  }

  private async getParentUserIdsForTrip(tripId: string): Promise<string[]> {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      select: { assignmentId: true },
    });
    if (!trip?.assignmentId) return [];

    const studentAssignments = await this.prisma.studentAssignment.findMany({
      where: { assignmentId: trip.assignmentId, isActive: true },
      select: {
        student: {
          select: {
            parentStudents: {
              select: {
                parent: { select: { userId: true } },
              },
            },
          },
        },
      },
    });

    const userIds: string[] = [];
    for (const sa of studentAssignments) {
      for (const ps of sa.student.parentStudents) {
        userIds.push(ps.parent.userId);
      }
    }
    return [...new Set(userIds)];
  }

  private async getSchoolAdminUserIds(schoolId: string): Promise<string[]> {
    const admins = await this.prisma.user.findMany({
      where: { schoolId, role: 'SCHOOL_ADMIN', status: 'ACTIVE' },
      select: { id: true },
    });
    return admins.map(u => u.id);
  }
}
