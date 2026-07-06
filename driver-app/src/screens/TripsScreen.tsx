import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  AppState,
  AppStateStatus,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, typography } from '../theme';
import { Trip } from '../types';
import * as tripsService from '../services/trips';
import { cacheData, getCachedData } from '../services/offline';
import { useOfflineStore } from '../store/offlineStore';
import TripCard from '../components/TripCard';
import LoadingView from '../components/LoadingView';
import EmptyState from '../components/EmptyState';
import ErrorView from '../components/ErrorView';
import OfflineBanner from '../components/OfflineBanner';

type RootStackParamList = {
  Trips: undefined;
  TripDetail: { tripId: string };
  StudentList: { tripId: string };
  QRScanner: { tripId: string };
  IncidentReport: { tripId?: string };
};

type TripsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Trips'>;

const TripsScreen: React.FC = () => {
  const navigation = useNavigation<TripsScreenNavigationProp>();
  const isOnline = useOfflineStore((state) => state.isOnline);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const appState = useRef(AppState.currentState);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const fetchTrips = useCallback(async () => {
    try {
      setError('');
      const data = await tripsService.getTodayTrips();
      setTrips(data);
      await cacheData('today_trips', data);
    } catch (e: any) {
      if (!isOnline) {
        const cached = await getCachedData<Trip[]>('today_trips');
        if (cached) {
          setTrips(cached);
          return;
        }
      }
      setError(e?.message || 'Failed to load trips');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isOnline]);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      (nextAppState: AppStateStatus) => {
        if (
          appState.current.match(/inactive|background/) &&
          nextAppState === 'active'
        ) {
          fetchTrips();
        }
        appState.current = nextAppState;
      },
    );
    return () => subscription.remove();
  }, [fetchTrips]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTrips();
  }, [fetchTrips]);

  const handleTripPress = (trip: Trip) => {
    navigation.navigate('TripDetail', { tripId: trip.id });
  };

  const renderTripItem = ({ item }: { item: Trip }) => (
    <TripCard trip={item} onPress={handleTripPress} />
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoadingView message="Loading trips..." />
      </SafeAreaView>
    );
  }

  if (error && trips.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorView message={error} onRetry={fetchTrips} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <OfflineBanner />
      <View style={styles.header}>
        <Text style={styles.title}>Today's Trips</Text>
        <Text style={styles.date}>{today}</Text>
      </View>
      <FlatList
        data={trips}
        keyExtractor={(item) => item.id}
        renderItem={renderTripItem}
        contentContainerStyle={
          trips.length === 0 ? styles.emptyContainer : styles.list
        }
        ListEmptyComponent={
          <EmptyState
            icon="🚌"
            title="No trips scheduled"
            subtitle="You have no trips scheduled for today."
          />
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: {
    ...typography.h1,
    marginBottom: spacing.xs,
  },
  date: {
    ...typography.caption,
  },
  list: {
    paddingVertical: spacing.sm,
  },
  emptyContainer: {
    flexGrow: 1,
  },
});

export default TripsScreen;
