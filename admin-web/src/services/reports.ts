import api from './api';

export interface DateRangeFilter {
  startDate: string;
  endDate: string;
  schoolId?: string;
}

export interface AttendanceReportEntry {
  date: string;
  present: number;
  absent: number;
  late: number;
  excused: number;
  total: number;
}

export interface MonthlyAttendanceEntry {
  month: string;
  present: number;
  absent: number;
  late: number;
  total: number;
  attendanceRate: number;
}

export interface DriverPerformanceEntry {
  driverId: string;
  driverName: string;
  totalTrips: number;
  onTimeTrips: number;
  lateTrips: number;
  cancelledTrips: number;
  onTimeRate: number;
  averageTripDuration: number;
  totalStudentsTransported: number;
}

export interface BusUtilizationEntry {
  busId: string;
  plateNumber: string;
  busNumber: string;
  totalTrips: number;
  totalStudents: number;
  capacity: number;
  utilizationRate: number;
  totalDistance?: number;
  activeDays: number;
}

export interface AttendanceReportResponse {
  daily: AttendanceReportEntry[];
  summary: {
    totalPresent: number;
    totalAbsent: number;
    totalLate: number;
    averageAttendanceRate: number;
  };
}

export interface MonthlyAttendanceResponse {
  monthly: MonthlyAttendanceEntry[];
  summary: {
    averageRate: number;
    bestMonth: string;
    worstMonth: string;
  };
}

export interface DriverPerformanceResponse {
  drivers: DriverPerformanceEntry[];
  summary: {
    averageOnTimeRate: number;
    bestDriver: string;
    worstDriver: string;
  };
}

export interface BusUtilizationResponse {
  buses: BusUtilizationEntry[];
  summary: {
    averageUtilization: number;
    totalTrips: number;
    totalStudents: number;
  };
}

export const reportService = {
  getDailyAttendance: async (filters: DateRangeFilter): Promise<AttendanceReportResponse> => {
    const { startDate, endDate, schoolId } = filters;
    const res = await api.get<any>('/reports/daily-attendance', {
      params: { schoolId: schoolId || '', date: startDate },
    });
    const data = res.data;
    const daily = data?.summary ? [{
      date: startDate,
      present: data.summary.presentToday || 0,
      absent: data.summary.absentToday || 0,
      late: data.summary.lateToday || 0,
      excused: data.summary.excusedToday || 0,
      total: data.summary.totalStudents || 0,
    }] : [];
    const total = daily[0] || { present: 0, absent: 0, late: 0, total: 0 };
    const totalPresent = total.present;
    const totalAbsent = total.absent;
    const totalLate = total.late;
    return {
      daily,
      summary: {
        totalPresent,
        totalAbsent,
        totalLate,
        averageAttendanceRate: total.total > 0 ? totalPresent / total.total : 0,
      },
    };
  },

  getMonthlyAttendance: async (filters: DateRangeFilter): Promise<MonthlyAttendanceResponse> => {
    const now = new Date(filters.startDate);
    const res = await api.get<any>('/reports/monthly-attendance', {
      params: { schoolId: filters.schoolId || '', month: now.getMonth() + 1, year: now.getFullYear() },
    });
    const data = res.data;
    const studentSummaries = data?.studentSummaries || [];
    const presentCount = data?.summary?.presentCount || 0;
    const absentCount = data?.summary?.absentCount || 0;
    const total = data?.totalStudents || 1;
    const rate = data?.summary?.averageAttendance ?? 0;
    return {
      monthly: [{
        month: `${now.toLocaleString('default', { month: 'short' })} ${now.getFullYear()}`,
        present: presentCount,
        absent: absentCount,
        late: data?.summary?.lateCount || 0,
        total,
        attendanceRate: rate / 100,
      }],
      summary: {
        averageRate: rate / 100,
        bestMonth: '',
        worstMonth: '',
      },
    };
  },

  getDriverPerformance: async (filters: DateRangeFilter & { driverId?: string }): Promise<DriverPerformanceResponse> => {
    const res = await api.get<any>('/reports/driver-performance', {
      params: {
        schoolId: filters.schoolId || '',
        fromDate: filters.startDate,
        toDate: filters.endDate,
        driverId: filters.driverId || undefined,
      },
    });
    const data = res.data || [];
    const drivers = data.map((d: any) => ({
      driverId: d.driverId,
      driverName: d.driverName,
      totalTrips: d.tripStats?.total || 0,
      onTimeTrips: d.tripStats?.completed || 0,
      lateTrips: 0,
      cancelledTrips: d.tripStats?.cancelled || 0,
      onTimeRate: d.tripStats?.onTimeRate ?? 0,
      averageTripDuration: 0,
      totalStudentsTransported: d.assignedStudents || 0,
    }));
    const rates = drivers.filter((d: any) => d.onTimeRate > 0);
    const avgOnTime = rates.length > 0 ? rates.reduce((s: number, d: any) => s + d.onTimeRate, 0) / rates.length : 0;
    return {
      drivers,
      summary: {
        averageOnTimeRate: avgOnTime,
        bestDriver: drivers.sort((a: any, b: any) => b.onTimeRate - a.onTimeRate)[0]?.driverName || '',
        worstDriver: drivers.sort((a: any, b: any) => a.onTimeRate - b.onTimeRate)[0]?.driverName || '',
      },
    };
  },

  getBusUtilization: async (filters: DateRangeFilter & { busId?: string }): Promise<BusUtilizationResponse> => {
    const res = await api.get<any>('/reports/bus-utilization', {
      params: {
        schoolId: filters.schoolId || '',
        fromDate: filters.startDate,
        toDate: filters.endDate,
        busId: filters.busId || undefined,
      },
    });
    const data = res.data || [];
    const buses = data.map((b: any) => ({
      busId: b.busId,
      plateNumber: b.plateNumber,
      busNumber: b.busNumber,
      totalTrips: b.tripStats?.total || 0,
      totalStudents: b.totalStudentsTransported || 0,
      capacity: b.capacity || 1,
      utilizationRate: (b.tripStats?.utilizationRate ?? 0) / 100,
      activeDays: b.tripStats?.total || 0,
    }));
    const rates = buses.filter((b: any) => b.utilizationRate > 0);
    const avgUtil = rates.length > 0 ? rates.reduce((s: number, b: any) => s + b.utilizationRate, 0) / rates.length : 0;
    return {
      buses,
      summary: {
        averageUtilization: avgUtil,
        totalTrips: buses.reduce((s: number, b: any) => s + b.totalTrips, 0),
        totalStudents: buses.reduce((s: number, b: any) => s + b.totalStudents, 0),
      },
    };
  },
};
