import api from './api';

export interface PendingStudent {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  grade: string;
  section: string | null;
  address: string;
  phone: string | null;
  profilePicture: string | null;
  schoolId: string;
  school: { id: string; name: string };
  parentId: string;
  parent: {
    user: { id: string; firstName: string; lastName: string; email: string; phone: string | null };
  };
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminNotes: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export const pendingStudentService = {
  list: async (params?: {
    page?: number;
    limit?: number;
    schoolId?: string;
    status?: string;
  }) => {
    const response = await api.get('/pending-students', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/pending-students/${id}`);
    return response.data;
  },

  approve: async (id: string, adminNotes?: string) => {
    const response = await api.post(`/pending-students/${id}/approve`, { adminNotes });
    return response.data;
  },

  reject: async (id: string, adminNotes?: string) => {
    const response = await api.post(`/pending-students/${id}/reject`, { adminNotes });
    return response.data;
  },
};
