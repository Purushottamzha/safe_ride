import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import * as authService from '../services/auth';
import { setAuthToken } from '../services/api';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email: string, password: string) => {
    const response = await authService.login(email, password);
    await AsyncStorage.setItem('user', JSON.stringify(response.user));
    set({
      user: response.user,
      accessToken: response.accessToken,
      isAuthenticated: true,
    });
  },

  logout: async () => {
    try {
      await authService.logout();
    } finally {
      await AsyncStorage.multiRemove(['accessToken', 'user']);
      set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
      });
    }
  },

  setUser: (user: User) => {
    set({ user });
  },

  hydrate: async () => {
    try {
      const [token, userJson] = await AsyncStorage.multiGet(['accessToken', 'user']);
      const accessToken = token[1];
      const user = userJson[1] ? JSON.parse(userJson[1]) : null;
      if (accessToken && user) {
        await setAuthToken(accessToken);
        set({
          user,
          accessToken,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },
}));
