import api from './api';

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
    const response = await api.get<Blob>(`/export/${entity}/csv`, {
      params: filters,
      responseType: 'blob',
    });
    return response.data;
  },

  exportExcel: async (entity: string, filters?: Record<string, any>): Promise<Blob> => {
    const response = await api.get<Blob>(`/export/${entity}/excel`, {
      params: filters,
      responseType: 'blob',
    });
    return response.data;
  },

  exportPdf: async (entity: string, filters?: Record<string, any>): Promise<Blob> => {
    const response = await api.get<Blob>(`/export/${entity}/pdf`, {
      params: filters,
      responseType: 'blob',
    });
    return response.data;
  },
};
