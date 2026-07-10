import api from './api';

function getExportEndpoint(entity: string, format: string): { path: string; params: Record<string, any> } {
  if (entity === 'attendance') {
    return { path: '/export/attendance', params: { format } };
  }
  const typeMap: Record<string, string> = {
    students: 'students',
    trips: 'trips',
    incidents: 'incidents',
  };
  return { path: '/export/report', params: { format, type: typeMap[entity] || 'students' } };
}

export const exportService = {
  importCsv: async (entity: string, file: File): Promise<{ imported: number; errors: string[] }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<{ imported: number; errors: string[] }>(`/export/${entity}/import`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  exportCsv: async (entity: string, filters?: Record<string, any>): Promise<Blob> => {
    const { path, params } = getExportEndpoint(entity, 'csv');
    const response = await api.get<Blob>(path, {
      params: { ...filters, ...params },
      responseType: 'blob',
    });
    return response.data;
  },

  exportExcel: async (entity: string, filters?: Record<string, any>): Promise<Blob> => {
    const { path, params } = getExportEndpoint(entity, 'excel');
    const response = await api.get<Blob>(path, {
      params: { ...filters, ...params },
      responseType: 'blob',
    });
    return response.data;
  },

  exportPdf: async (entity: string, filters?: Record<string, any>): Promise<Blob> => {
    const { path, params } = getExportEndpoint(entity, 'pdf');
    const response = await api.get<Blob>(path, {
      params: { ...filters, ...params },
      responseType: 'blob',
    });
    return response.data;
  },
};
