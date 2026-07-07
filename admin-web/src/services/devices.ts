import api from './api';

export const deviceService = {
  list: async (params?: { page?: number; limit?: number; schoolId?: string }) => {
    const response = await api.get('/devices', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/devices/${id}`);
    return response.data;
  },

  register: async (data: {
    name: string;
    type: 'WEBCAM_DEMO' | 'ESP32_CAM' | 'ESP32_GPS';
    busId?: string;
    schoolId?: string;
    firmwareVersion?: string;
  }) => {
    const response = await api.post('/devices', data);
    return response.data;
  },

  updateStatus: async (id: string, status: 'ACTIVE' | 'INACTIVE' | 'ERROR') => {
    const response = await api.post(`/devices/${id}/status`, { status });
    return response.data;
  },

  rotateKey: async (id: string) => {
    const response = await api.post(`/devices/${id}/rotate-key`);
    return response.data;
  },
};
