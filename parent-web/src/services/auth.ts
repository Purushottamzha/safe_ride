import api from './api';
import type { LoginCredentials, AuthResponse, User } from '@/types';

export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  const { data } = await api.post<AuthResponse>('/auth/login', credentials);
  return data;
};

export const getProfile = async (): Promise<User> => {
  const { data } = await api.get<User>('/auth/me');
  return data;
};

export const logout = async (): Promise<void> => {
  try {
    await api.post('/auth/logout');
  } catch {
    // Silently handle logout errors
  }
};
