import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ExportService {
  private readonly logger = new Logger(ExportService.name);

  exportToCsv(data: Record<string, unknown>[], headers: string[]): string {
    const headerRow = headers.join(',');
    const rows = data.map((item) =>
      headers
        .map((header) => {
          const value = item[header];
          if (value === null || value === undefined) return '';
          const str = String(value);
          if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(','),
    );
    return [headerRow, ...rows].join('\n');
  }

  exportToExcel(data: Record<string, unknown>[], headers: string[]): string {
    this.logger.warn('Excel export is not fully implemented. Returning CSV as fallback.');
    return this.exportToCsv(data, headers);
  }

  exportToPdf(html: string): string {
    this.logger.warn('PDF export is not fully implemented. Returning CSV as fallback.');
    const data = [{ html: html.replace(/,/g, '') }];
    return this.exportToCsv(data, ['html']);
  }

  prepareReportData(
    reportType: string,
    reportData: Record<string, unknown>,
  ): { data: Record<string, unknown>[]; headers: string[] } {
    switch (reportType) {
      case 'daily-attendance': {
        const attendance = (reportData['attendance'] || []) as Record<string, unknown>[];
        const headers = [
          'Student ID',
          'Student Name',
          'Grade',
          'Section',
          'Status',
          'Late Minutes',
          'Board Time',
          'Exit Time',
        ];
        const data = attendance.map((a: Record<string, unknown>) => {
          const student = (a['student'] as Record<string, unknown>) || {};
          return {
            'Student ID': student['studentId'] || '',
            'Student Name': `${student['firstName'] || ''} ${student['lastName'] || ''}`,
            Grade: student['grade'] || '',
            Section: student['section'] || '',
            Status: a['status'] || '',
            'Late Minutes': a['lateMinutes'] ?? '',
            'Board Time': a['boardTime'] ? new Date(a['boardTime'] as string).toISOString() : '',
            'Exit Time': a['exitTime'] ? new Date(a['exitTime'] as string).toISOString() : '',
          };
        });
        return { data, headers };
      }

      case 'monthly-attendance': {
        const summaries = (reportData['studentSummaries'] || []) as Record<string, unknown>[];
        const headers = [
          'Student ID',
          'Student Name',
          'Student ID Code',
          'Grade',
          'Section',
          'Days Present',
          'Days Absent',
          'Attendance %',
        ];
        const data = summaries.map((s: Record<string, unknown>) => ({
          'Student ID': s['studentId'] || '',
          'Student Name': s['studentName'] || '',
          'Student ID Code': s['studentIdCode'] || '',
          Grade: s['grade'] || '',
          Section: s['section'] || '',
          'Days Present': s['daysPresent'] ?? 0,
          'Days Absent': s['daysAbsent'] ?? 0,
          'Attendance %': s['attendancePercentage'] ?? 0,
        }));
        return { data, headers };
      }

      case 'driver-performance': {
        const drivers = reportData['drivers'] || (Array.isArray(reportData) ? reportData : []);
        const headers = [
          'Driver ID',
          'Driver Name',
          'Email',
          'License Number',
          'Total Trips',
          'Completed',
          'Cancelled',
          'Active',
          'Completion Rate %',
          'On-Time Rate %',
        ];
        const data = (drivers as Record<string, unknown>[]).map((d: Record<string, unknown>) => {
          const stats = (d['tripStats'] as Record<string, unknown>) || {};
          return {
            'Driver ID': d['driverId'] || '',
            'Driver Name': d['driverName'] || '',
            Email: d['email'] || '',
            'License Number': d['licenseNumber'] || '',
            'Total Trips': stats['total'] ?? 0,
            Completed: stats['completed'] ?? 0,
            Cancelled: stats['cancelled'] ?? 0,
            Active: stats['active'] ?? 0,
            'Completion Rate %': stats['completionRate'] ?? 0,
            'On-Time Rate %': stats['onTimeRate'] ?? 0,
          };
        });
        return { data, headers };
      }

      case 'bus-utilization': {
        const buses = reportData['buses'] || (Array.isArray(reportData) ? reportData : []);
        const headers = [
          'Bus ID',
          'Plate Number',
          'Bus Number',
          'Capacity',
          'Status',
          'Total Trips',
          'Completed Trips',
          'Utilization Rate %',
          'Students Transported',
          'Events',
        ];
        const data = (buses as Record<string, unknown>[]).map((b: Record<string, unknown>) => {
          const stats = (b['tripStats'] as Record<string, unknown>) || {};
          return {
            'Bus ID': b['busId'] || '',
            'Plate Number': b['plateNumber'] || '',
            'Bus Number': b['busNumber'] || '',
            Capacity: b['capacity'] ?? 0,
            Status: b['status'] || '',
            'Total Trips': stats['total'] ?? 0,
            'Completed Trips': stats['completed'] ?? 0,
            'Utilization Rate %': stats['utilizationRate'] ?? 0,
            'Students Transported': b['totalStudentsTransported'] ?? 0,
            Events: b['totalEvents'] ?? 0,
          };
        });
        return { data, headers };
      }

      case 'late-students': {
        const lateStudents = (reportData['lateStudents'] || []) as Record<string, unknown>[];
        const headers = [
          'Student ID',
          'Student Name',
          'Grade',
          'Section',
          'Late Count',
          'Total Late Minutes',
        ];
        const data = lateStudents.map((s: Record<string, unknown>) => ({
          'Student ID': s['studentId'] || '',
          'Student Name': s['studentName'] || '',
          Grade: s['grade'] || '',
          Section: s['section'] || '',
          'Late Count': s['lateCount'] ?? 0,
          'Total Late Minutes': s['totalLateMinutes'] ?? 0,
        }));
        return { data, headers };
      }

      case 'attendance-heatmap': {
        const byGradeSection = (reportData['byGradeSection'] || []) as Record<string, unknown>[];
        const headers = [
          'Grade',
          'Section',
          'Present',
          'Absent',
          'Late',
          'Excused',
          'Total',
          'Attendance Rate %',
        ];
        const data = byGradeSection.map((g: Record<string, unknown>) => ({
          Grade: g['grade'] || '',
          Section: (g['section'] as string) || '',
          Present: g['present'] ?? 0,
          Absent: g['absent'] ?? 0,
          Late: g['late'] ?? 0,
          Excused: g['excused'] ?? 0,
          Total: g['total'] ?? 0,
          'Attendance Rate %': g['attendanceRate'] ?? 0,
        }));
        return { data, headers };
      }

      default: {
        this.logger.warn(`Unknown report type: ${reportType}. Returning raw data.`);
        const keys = Object.keys(reportData).filter((k) => !Array.isArray(reportData[k]));
        const headers = keys.length > 0 ? keys : Object.keys(reportData);
        return { data: [reportData], headers };
      }
    }
  }
}
