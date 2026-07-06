import { useEffect, useMemo } from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { lightTheme, darkTheme } from './theme';
import { useThemeStore } from './store/themeStore';
import { useAuthStore } from './store/authStore';
import { useAuth } from './hooks/useAuth';
import { createRouter } from './router';
import LoadingScreen from './components/common/LoadingScreen';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30000,
    },
  },
});

function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isLoading, loadUser } = useAuth();
  const token = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  if (isLoading && token) {
    return <LoadingScreen />;
  }

  return <>{children}</>;
}

function AppContent() {
  const mode = useThemeStore((s) => s.mode);
  const isLoading = useAuthStore((s) => s.isLoading);
  const token = useAuthStore((s) => s.accessToken);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const theme = useMemo(() => (mode === 'dark' ? darkTheme : lightTheme), [mode]);
  const router = useMemo(() => createRouter(isAuthenticated || !!token), [isAuthenticated, token]);

  const showLoader = isLoading && token;
  if (showLoader) return null;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </QueryClientProvider>
  );
}
