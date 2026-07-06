import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/auth';
import type { LoginCredentials } from '../types';

export function useAuth() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, login: storeLogin, logout: storeLogout, setLoading } = useAuthStore();

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginCredentials) => authService.login(credentials),
    onSuccess: (data) => {
      storeLogin(data.user, data.accessToken, data.refreshToken);
      navigate('/dashboard');
    },
  });

  const logout = useCallback(async () => {
    await authService.logout();
    storeLogout();
    navigate('/login');
  }, [storeLogout, navigate]);

  const loadUser = useCallback(async () => {
    if (!useAuthStore.getState().accessToken) {
      setLoading(false);
      return;
    }
    try {
      const userData = await authService.getProfile();
      useAuthStore.getState().setUser(userData);
    } catch {
      storeLogout();
    } finally {
      setLoading(false);
    }
  }, [setLoading, storeLogout]);

  return {
    user,
    isAuthenticated,
    isLoading,
    login: loginMutation.mutate,
    loginError: loginMutation.error,
    isLoginLoading: loginMutation.isPending,
    logout,
    loadUser,
  };
}
