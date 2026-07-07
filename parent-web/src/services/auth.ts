import api from './api';
import type { LoginCredentials, AuthResponse, User } from '@/types';

function mapUser(raw: { id: string; email: string; firstName: string; lastName: string; phone?: string }): User {
  return {
    id: raw.id,
    email: raw.email,
    name: `${raw.firstName} ${raw.lastName}`,
    phone: raw.phone,
    role: 'parent',
  };
}

export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  const { data } = await api.post('/auth/login', credentials);
  return {
    user: mapUser(data.user),
    accessToken: data.tokens.accessToken,
    refreshToken: data.tokens.refreshToken,
  };
};

export const getProfile = async (): Promise<User> => {
  const { data } = await api.get('/auth/profile');
  return mapUser(data);
};

export const logout = async (): Promise<void> => {
  try {
    await api.post('/auth/logout');
  } catch {
    // Silently handle logout errors
  }
};
