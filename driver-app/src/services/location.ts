import { Platform, PermissionsAndroid } from 'react-native';
import { emitLocation } from './socket';

const geo = (navigator as any).geolocation as {
  watchPosition: (success: (pos: any) => void, error: (err: any) => void, options?: any) => number;
  clearWatch: (id: number) => void;
  getCurrentPosition: (success: (pos: any) => void, error: (err: any) => void, options?: any) => void;
};

let watchId: number | null = null;
let intervalId: ReturnType<typeof setInterval> | null = null;
let lastPosition: { latitude: number; longitude: number; speed: number; heading: number } | null = null;
let currentTripId: string | null = null;

export const requestLocationPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }
  return true;
};

export const startTracking = async (tripId: string): Promise<boolean> => {
  const hasPermission = await requestLocationPermission();
  if (!hasPermission) return false;

  currentTripId = tripId;

  if (watchId !== null) {
    geo.clearWatch(watchId);
  }

  watchId = geo.watchPosition(
    (position) => {
      lastPosition = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        speed: position.coords.speed ?? 0,
        heading: position.coords.heading ?? 0,
      };
    },
    (error) => {
      console.error('Location watch error:', error);
    },
    {
      enableHighAccuracy: true,
      distanceFilter: 10,
      interval: 5000,
      fastestInterval: 2000,
    },
  );

  intervalId = setInterval(() => {
    if (lastPosition && currentTripId) {
      emitLocation(
        currentTripId,
        lastPosition.latitude,
        lastPosition.longitude,
        lastPosition.speed,
        lastPosition.heading,
      );
    }
  }, 5000);

  return true;
};

export const stopTracking = () => {
  if (watchId !== null) {
    geo.clearWatch(watchId);
    watchId = null;
  }
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
  lastPosition = null;
  currentTripId = null;
};

export const getCurrentPosition = (): Promise<{ latitude: number; longitude: number }> => {
  return new Promise((resolve, reject) => {
    geo.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => reject(error),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  });
};

export const isTracking = () => currentTripId !== null;
