import api from './api';

export interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId?: string;
  userId?: string;
  user?: { id: string; firstName: string; lastName: string; email: string };
  schoolId?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  diff?: Record<string, any>;
  ip?: string;
  userAgent?: string;
  createdAt: string;
}

export interface AuditLogFilters {
  page?: number;
  limit?: number;
  action?: string;
  entity?: string;
  userId?: string;
  schoolId?: string;
  startDate?: string;
  endDate?: string;
}

export interface PaginatedAuditLogs {
  data: AuditLog[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export const auditLogService = {
  list: async (filters?: AuditLogFilters): Promise<PaginatedAuditLogs> => {
    const response = await api.get<PaginatedAuditLogs>('/audit-logs', { params: filters });
    return response.data;
  },

  getById: async (id: string): Promise<AuditLog> => {
    const response = await api.get<AuditLog>(`/audit-logs/${id}`);
    return response.data;
  },
};
