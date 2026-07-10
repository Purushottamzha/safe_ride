import api from './api';

export const qrManagementService = {
  getDashboard: async (): Promise<any> => {
    const res = await api.get('/qr/dashboard');
    return res.data;
  },

  getStudentQR: async (studentId: string): Promise<any> => {
    const res = await api.get(`/qr/student/${studentId}`);
    return res.data;
  },

  generateQR: async (studentId: string, force = false): Promise<any> => {
    const res = await api.post(`/qr/student/${studentId}/generate?force=${force}`);
    return res.data;
  },

  regenerateQR: async (studentId: string): Promise<any> => {
    const res = await api.post(`/qr/student/${studentId}/regenerate`);
    return res.data;
  },

  bulkGenerate: async (filters: Record<string, any>): Promise<any> => {
    const res = await api.post('/qr/bulk/generate', filters);
    return res.data;
  },

  downloadQR: (studentId: string): string => {
    const token = JSON.parse(localStorage.getItem('auth-storage') || '{}')?.state?.accessToken;
    return `/api/v1/qr/download/${studentId}?token=${token}`;
  },

  downloadBulkZip: async (filters: Record<string, any>): Promise<void> => {
    const res = await api.post('/qr/download/bulk', filters, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'qrcodes.zip');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  getPrintableCard: async (studentId: string): Promise<any> => {
    const res = await api.get(`/qr/print/${studentId}`);
    return res.data;
  },

  getPrintableCards: async (filters: Record<string, any>): Promise<any> => {
    const res = await api.post('/qr/print/bulk', filters);
    return res.data;
  },
};
