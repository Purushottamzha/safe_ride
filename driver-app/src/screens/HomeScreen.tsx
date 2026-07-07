import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, StyleSheet, RefreshControl, AppState, AppStateStatus,
  TouchableOpacity, ActivityIndicator, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, typography } from '../theme';
import { Trip } from '../types';
import * as tripsService from '../services/trips';
import { cacheData, getCachedData } from '../services/offline';
import { useOfflineStore } from '../store/offlineStore';
import { useAuthStore } from '../store/authStore';
import LoadingView from '../components/LoadingView';
import ErrorView from '../components/ErrorView';
import OfflineBanner from '../components/OfflineBanner';
import SkeletonLoader, { SkeletonHeroCard, SkeletonTripRow } from '../components/SkeletonLoader';

const { width } = Dimensions.get('window');

type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  ActiveTrip: { tripId: string };
  QRScanner: { tripId: string; scanType?: 'BOARD_IN' | 'EXIT_OUT' };
  EndTripSummary: { tripId: string; stats?: any };
  Emergency: { tripId: string };
};

type NavProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
  const navigation = useNavigation<NavProp>();
  const user = useAuthStore((s) => s.user);
  const isOnline = useOfflineStore((s) => s.isOnline);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const appState = useRef(AppState.currentState);

  const activeTrip = trips.find(t => t.status === 'ACTIVE');
  const scheduledTrip = trips.find(t => t.status === 'SCHEDULED');
  const primaryTrip = activeTrip || scheduledTrip;

  const fetchTrips = useCallback(async () => {
    try {
      setError('');
      const data = await tripsService.getTodayTrips();
      setTrips(data);
      await cacheData('today_trips', data);
    } catch (e: any) {
      if (!isOnline) {
        const cached = await getCachedData<Trip[]>('today_trips');
        if (cached) { setTrips(cached); return; }
      }
      setError(e?.message || 'Failed to load trips');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isOnline]);

  useEffect(() => { fetchTrips(); }, [fetchTrips]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && next === 'active') fetchTrips();
      appState.current = next;
    });
    return () => sub.remove();
  }, [fetchTrips]);

  const onRefresh = () => { setRefreshing(true); fetchTrips(); };

  const driverName = user ? `${user.firstName} ${user.lastName}` : 'Driver';

  if (loading) return (
    <SafeAreaView style={styles.safeArea}>
      <OfflineBanner />
      <View style={{ paddingHorizontal: spacing.md, paddingTop: spacing.sm }}>
        <SkeletonLoader width={120} height={16} />
        <SkeletonLoader width={180} height={32} style={{ marginTop: 4 }} />
      </View>
      <SkeletonHeroCard />
      <View style={{ paddingHorizontal: spacing.md }}>
        <SkeletonLoader width={100} height={16} style={{ marginBottom: 12 }} />
      </View>
      {[1, 2, 3].map(i => <SkeletonTripRow key={i} />)}
    </SafeAreaView>
  );
  if (error && trips.length === 0) return <SafeAreaView style={styles.safeArea}><ErrorView message={error} onRetry={fetchTrips} /></SafeAreaView>;

  return (
    <SafeAreaView style={styles.safeArea}>
      <OfflineBanner />
      <FlatList
        data={trips}
        keyExtractor={t => t.id}
        contentContainerStyle={trips.length === 0 ? styles.emptyContainer : styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <Text style={styles.greeting}>Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'},</Text>
            <Text style={styles.driverName}>{driverName}</Text>

            {primaryTrip ? (
              <TouchableOpacity
                style={styles.heroCard}
                onPress={() => navigation.navigate('ActiveTrip', { tripId: primaryTrip.id })}
                activeOpacity={0.9}
              >
                <View style={styles.heroTop}>
                  <Text style={styles.heroLabel}>
                    {primaryTrip.type === 'MORNING' ? 'Morning Trip' : 'Afternoon Trip'}
                  </Text>
                  <View style={[styles.heroStatus, { backgroundColor: activeTrip ? colors.success + '20' : colors.info + '20' }]}>
                    <View style={[styles.heroStatusDot, { backgroundColor: activeTrip ? colors.success : colors.info }]} />
                    <Text style={[styles.heroStatusText, { color: activeTrip ? colors.success : colors.info }]}>
                      {activeTrip ? 'ACTIVE' : 'SCHEDULED'}
                    </Text>
                  </View>
                </View>

                <View style={styles.heroBus}>
                  <Text style={styles.heroBusNumber}>{primaryTrip.bus?.busNumber || 'Bus'}</Text>
                  <Text style={styles.heroBusPlate}>{primaryTrip.bus?.plateNumber || ''}</Text>
                </View>

                {primaryTrip.route && (
                  <Text style={styles.heroRoute}>{primaryTrip.route.name}</Text>
                )}

                <Text style={styles.heroTime}>
                  {new Date(primaryTrip.scheduledAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </Text>

                {activeTrip ? (
                  <View style={styles.heroAction}>
                    <Text style={styles.heroActionText}>View Live Status →</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.startButton}
                    onPress={() => navigation.navigate('ActiveTrip', { tripId: primaryTrip.id })}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.startButtonIcon}>▶</Text>
                    <Text style={styles.startButtonText}>START TRIP</Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            ) : (
              <View style={styles.noTripCard}>
                <Text style={styles.noTripIcon}>🚌</Text>
                <Text style={styles.noTripTitle}>No Trips Today</Text>
                <Text style={styles.noTripSub}>You have no trips scheduled. Rest up!</Text>
              </View>
            )}

            <Text style={styles.sectionTitle}>
              {activeTrip ? 'Other Trips' : 'Today\'s Schedule'}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          if (item.id === primaryTrip?.id) return null;
          const isActive = item.status === 'ACTIVE';
          return (
            <TouchableOpacity
              style={styles.tripRow}
              onPress={() => navigation.navigate('ActiveTrip', { tripId: item.id })}
              activeOpacity={0.7}
            >
              <View style={[styles.tripDot, { backgroundColor: isActive ? colors.success : colors.border }]} />
              <View style={styles.tripRowInfo}>
                <Text style={styles.tripRowType}>{item.type === 'MORNING' ? 'Morning' : 'Afternoon'}</Text>
                <Text style={styles.tripRowTime}>
                  {new Date(item.scheduledAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
              <Text style={styles.tripRowBus}>{item.bus?.busNumber || '-'}</Text>
              <Text style={styles.tripRowRoute}>{item.route?.name || ''}</Text>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          !primaryTrip ? (
            <View style={styles.emptyInner}>
              <Text style={styles.emptyTitle}>No trips scheduled</Text>
              <Text style={styles.emptySub}>You have no trips for today.</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  list: { paddingBottom: spacing.xl },
  emptyContainer: { flexGrow: 1 },
  greeting: { ...typography.h2, color: colors.textSecondary, marginBottom: 2, paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  driverName: { fontSize: 28, fontWeight: '800', color: colors.text, marginBottom: spacing.lg, paddingHorizontal: spacing.md },
  heroCard: {
    marginHorizontal: spacing.md, marginBottom: spacing.lg,
    backgroundColor: colors.primary, borderRadius: 20, padding: spacing.lg,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  heroLabel: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  heroStatus: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  heroStatusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  heroStatusText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  heroBus: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 4 },
  heroBusNumber: { color: '#FFFFFF', fontSize: 36, fontWeight: '800' },
  heroBusPlate: { color: '#FFFFFFB3', fontSize: 14, fontWeight: '500' },
  heroRoute: { color: '#FFFFFFCC', fontSize: 15, marginBottom: spacing.xs },
  heroTime: { color: '#FFFFFF99', fontSize: 13, marginBottom: spacing.md },
  heroAction: { backgroundColor: '#FFFFFF20', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  heroActionText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  startButton: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    backgroundColor: colors.success, paddingVertical: 18, borderRadius: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5,
  },
  startButtonIcon: { fontSize: 18, marginRight: spacing.sm, color: '#FFFFFF' },
  startButtonText: { color: '#FFFFFF', fontSize: 20, fontWeight: '800', letterSpacing: 1 },
  noTripCard: {
    marginHorizontal: spacing.md, marginBottom: spacing.lg,
    backgroundColor: colors.surface, borderRadius: 20, padding: spacing.xl,
    alignItems: 'center', borderWidth: 1, borderColor: colors.border,
  },
  noTripIcon: { fontSize: 48, marginBottom: spacing.sm },
  noTripTitle: { ...typography.h2, marginBottom: spacing.xs },
  noTripSub: { ...typography.caption },
  sectionTitle: { ...typography.h3, paddingHorizontal: spacing.md, marginBottom: spacing.sm, marginTop: spacing.xs },
  tripRow: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.md,
    paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  tripDot: { width: 8, height: 8, borderRadius: 4, marginRight: spacing.sm },
  tripRowInfo: { flex: 1 },
  tripRowType: { fontSize: 14, fontWeight: '600', color: colors.text },
  tripRowTime: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  tripRowBus: { fontSize: 13, fontWeight: '600', color: colors.text, marginRight: spacing.sm },
  tripRowRoute: { fontSize: 12, color: colors.textSecondary },
  emptyInner: { alignItems: 'center', paddingVertical: spacing.xl },
  emptyTitle: { ...typography.body, fontWeight: '600' },
  emptySub: { ...typography.caption, marginTop: 4 },
});
