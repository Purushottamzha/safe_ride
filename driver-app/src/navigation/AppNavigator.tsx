import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import LoginScreen from '../screens/LoginScreen';
import TripsScreen from '../screens/TripsScreen';
import TripDetailScreen from '../screens/TripDetailScreen';
import QRScannerScreen from '../screens/QRScannerScreen';
import IncidentReportScreen from '../screens/IncidentReportScreen';

export type RootStackParamList = {
  Login: undefined;
  Trips: undefined;
  TripDetail: { tripId: string };
  QRScanner: { tripId: string };
  IncidentReport: { tripId?: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      {isAuthenticated ? (
        <>
          <Stack.Screen name="Trips" component={TripsScreen} />
          <Stack.Screen
            name="TripDetail"
            component={TripDetailScreen}
            options={{
              headerShown: true,
              headerTitle: 'Trip Details',
              headerBackTitle: 'Back',
              headerTintColor: '#2563EB',
              headerStyle: { backgroundColor: '#F8FAFC' },
              headerShadowVisible: false,
            }}
          />
          <Stack.Screen
            name="QRScanner"
            component={QRScannerScreen}
            options={{
              headerShown: true,
              headerTitle: 'Scan QR',
              headerBackTitle: 'Back',
              headerTintColor: '#2563EB',
              headerStyle: { backgroundColor: '#F8FAFC' },
              headerShadowVisible: false,
            }}
          />
          <Stack.Screen
            name="IncidentReport"
            component={IncidentReportScreen}
            options={{
              headerShown: true,
              headerTitle: 'Report Incident',
              headerBackTitle: 'Back',
              headerTintColor: '#2563EB',
              headerStyle: { backgroundColor: '#F8FAFC' },
              headerShadowVisible: false,
            }}
          />
        </>
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
