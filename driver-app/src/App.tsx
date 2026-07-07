import React, { useEffect, useRef } from 'react';
import { StatusBar, LogBox, AppState, AppStateStatus } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import NetInfo from '@react-native-community/netinfo';
import AppNavigator from './navigation/AppNavigator';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './components/Toast';
import { useAuthStore } from './store/authStore';
import { useOfflineStore } from './store/offlineStore';
import { syncPendingRequests, getPendingCount } from './services/offline';
import { connect, disconnect } from './services/socket';
import { stopTracking, isTracking } from './services/location';
import LoadingView from './components/LoadingView';

LogBox.ignoreLogs(['Non-serializable values']);

const App: React.FC = () => {
  const hydrate = useAuthStore((state) => state.hydrate);
  const isLoading = useAuthStore((state) => state.isLoading);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const setOnline = useOfflineStore((state) => state.setOnline);
  const clearPending = useOfflineStore((state) => state.clearPending);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (isAuthenticated) {
      connect();
    } else {
      disconnect();
      if (isTracking()) {
        stopTracking();
      }
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = state.isConnected ?? true;
      setOnline(online);

      if (online) {
        syncPendingRequests().then(() => {
          getPendingCount().then((count) => {
            if (count === 0) {
              clearPending();
            }
          });
        });
      }
    });

    return () => unsubscribe();
  }, [setOnline, clearPending]);

  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      (nextAppState: AppStateStatus) => {
        if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
          if (isAuthenticated) {
            connect();
          }
        } else if (nextAppState.match(/inactive|background/)) {
          if (isTracking()) {
            stopTracking();
          }
        }
        appState.current = nextAppState;
      },
    );

    return () => subscription.remove();
  }, [isAuthenticated]);

  if (isLoading) {
    return <LoadingView message="Starting SafeRide..." />;
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <ToastProvider>
          <NavigationContainer>
            <StatusBar
              barStyle="dark-content"
              backgroundColor="#F8FAFC"
              translucent={false}
            />
            <AppNavigator />
          </NavigationContainer>
        </ToastProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
};

export default App;
