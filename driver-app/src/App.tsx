import React, { useEffect } from 'react';
import { StatusBar, LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import NetInfo from '@react-native-community/netinfo';
import AppNavigator from './navigation/AppNavigator';
import { useAuthStore } from './store/authStore';
import { useOfflineStore } from './store/offlineStore';
import { syncPendingRequests, getPendingCount } from './services/offline';
import LoadingView from './components/LoadingView';

LogBox.ignoreLogs(['Non-serializable values']);

const App: React.FC = () => {
  const hydrate = useAuthStore((state) => state.hydrate);
  const isLoading = useAuthStore((state) => state.isLoading);
  const setOnline = useOfflineStore((state) => state.setOnline);
  const clearPending = useOfflineStore((state) => state.clearPending);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

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

  if (isLoading) {
    return <LoadingView message="Starting SafeRide..." />;
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#F8FAFC"
          translucent={false}
        />
        <AppNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default App;
