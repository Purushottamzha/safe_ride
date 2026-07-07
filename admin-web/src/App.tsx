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
import { socketService } from './services/socket';
import LoadingScreen from './components/common/LoadingScreen';
import ErrorBoundary from './components/common/ErrorBoundary';
import { ToastProvider } from './components/common/ToastProvider';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30000,
    },
  },
});

function SocketInitializer() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const token = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (isAuthenticated && token) {
      socketService.connect(token);
    } else {
      socketService.disconnect();
    }
    return () => { socketService.disconnect(); };
  }, [isAuthenticated, token]);

  return null;
}

function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isLoading, loadUser } = useAuth();
  const token = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  if (isLoading && token) {
    return <LoadingScreen />;
  }

  return (
    <>
      <SocketInitializer />
      {children}
    </>
  );
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
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </ToastProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
