import api, { setAuthToken } from './api';

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  accessToken: string;
}

export const login = async (email: string, password: string): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>('/api/v1/auth/login', { email, password });
  const data = response.data;
  await setAuthToken(data.accessToken);
  return data;
};

export const getProfile = async () => {
  const response = await api.get('/api/v1/auth/profile');
  return response.data;
};

export const logout = async () => {
  try {
    await api.post('/api/v1/auth/logout');
  } finally {
    await setAuthToken(null);
  }
};
