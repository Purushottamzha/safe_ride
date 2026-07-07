import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import ActiveTripScreen from '../screens/ActiveTripScreen';
import QRScannerScreen from '../screens/QRScannerScreen';
import EndTripSummaryScreen from '../screens/EndTripSummaryScreen';
import IncidentReportScreen from '../screens/IncidentReportScreen';
import EmergencyScreen from '../screens/EmergencyScreen';

export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  ActiveTrip: { tripId: string };
  QRScanner: { tripId: string; scanType?: 'BOARD_IN' | 'EXIT_OUT' };
  EndTripSummary: { tripId: string; stats?: any };
  IncidentReport: { tripId?: string };
  Emergency: { tripId: string };
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
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen
            name="ActiveTrip"
            component={ActiveTripScreen}
            options={{
              headerShown: true,
              headerTitle: 'Trip',
              headerBackTitle: 'Back',
              headerTintColor: '#2563EB',
              headerStyle: { backgroundColor: '#F8FAFC' },
              headerShadowVisible: false,
            }}
          />
          <Stack.Screen
            name="QRScanner"
            component={QRScannerScreen}
            options={{ headerShown: false, presentation: 'fullScreenModal' }}
          />
          <Stack.Screen
            name="EndTripSummary"
            component={EndTripSummaryScreen}
            options={{ headerShown: false, gestureEnabled: false }}
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
          <Stack.Screen
            name="Emergency"
            component={EmergencyScreen}
            options={{
              headerShown: true,
              headerTitle: 'Emergency',
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
