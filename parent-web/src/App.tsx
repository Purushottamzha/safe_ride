import { useEffect, useMemo } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { RouterProvider } from 'react-router-dom';
import { router } from '@/router';
import lightTheme from '@/theme';
import darkTheme from '@/theme/dark';
import { useThemeStore } from '@/store/themeStore';
import { useAuthStore } from '@/store/authStore';
import { socketService } from '@/services/socket';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { ToastProvider, useToast } from '@/components/common/ToastProvider';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30000,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

function SocketInitializer() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      socketService.connect();
    } else {
      socketService.disconnect();
    }
    return () => {
      socketService.disconnect();
    };
  }, [isAuthenticated]);

  return null;
}

function NotificationToastHandler() {
  const { showToast } = useToast();

  useEffect(() => {
    socketService.on('notification', (data) => {
      showToast(data.title, 'info');
    });
  }, [showToast]);

  return null;
}

export default function App() {
  const mode = useThemeStore((s) => s.mode);
  const theme = useMemo(() => (mode === 'dark' ? darkTheme : lightTheme), [mode]);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <ToastProvider>
            <SocketInitializer />
            <NotificationToastHandler />
            <RouterProvider router={router} />
          </ToastProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
