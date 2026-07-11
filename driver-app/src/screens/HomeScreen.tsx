import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, StyleSheet, RefreshControl, AppState, AppStateStatus,
  TouchableOpacity, ActivityIndicator, Dimensions, Animated,
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
const CARD_WIDTH = width - spacing.md * 2;

type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  ActiveTrip: { tripId: string };
  QRScanner: { tripId: string; scanType?: 'BOARD_IN' | 'EXIT_OUT' };
  EndTripSummary: { tripId: string; stats?: any };
  Emergency: { tripId: string };
};

type NavProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export default function HomeScreen() {
  const navigation = useNavigation<NavProp>();
  const user = useAuthStore((s) => s.user);
  const isOnline = useOfflineStore((s) => s.isOnline);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const appState = useRef(AppState.currentState);

  const activeTrip = trips.find(t => t.status === 'ACTIVE');
  const scheduledTrip = trips.find(t => t.status === 'SCHEDULED');
  const primaryTrip = activeTrip || scheduledTrip;

  useEffect(() => {
    if (activeTrip) {
      const anim = Animated.loop(Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.6, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ]));
      anim.start();
      return () => anim.stop();
    }
  }, [activeTrip, pulseAnim]);

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
        <SkeletonLoader width={100} height={14} />
        <SkeletonLoader width={180} height={28} style={{ marginTop: 4 }} />
      </View>
      <SkeletonHeroCard />
      <View style={{ paddingHorizontal: spacing.md }}>
        <SkeletonLoader width={100} height={16} style={{ marginBottom: 12 }} />
      </View>
      {[1, 2].map(i => <SkeletonTripRow key={i} />)}
    </SafeAreaView>
  );

  if (error && trips.length === 0) return (
    <SafeAreaView style={styles.safeArea}>
      <ErrorView message={error} onRetry={fetchTrips} />
    </SafeAreaView>
  );

  const otherTrips = trips.filter(t => t.id !== primaryTrip?.id);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <OfflineBanner />
      <FlatList
        data={otherTrips}
        keyExtractor={t => t.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
        ListHeaderComponent={
          <View>
            <View style={styles.headerSection}>
              <View>
                <Text style={styles.greeting}>{getGreeting()},</Text>
                <Text style={styles.driverName}>{driverName}</Text>
              </View>
              <TouchableOpacity style={styles.profileCircle} onPress={() => {}} activeOpacity={0.7}>
                <Text style={styles.profileLetter}>{driverName[0]}</Text>
              </TouchableOpacity>
            </View>

            {activeTrip && (
              <TouchableOpacity
                style={styles.activeTripCard}
                onPress={() => navigation.navigate('ActiveTrip', { tripId: activeTrip.id })}
                activeOpacity={0.95}
              >
                <View style={styles.activeTripTop}>
                  <View style={styles.activeTripBadgeRow}>
                    <Animated.View style={[styles.activePulse, { opacity: pulseAnim }]} />
                    <Text style={styles.activeTripBadge}>Live Trip</Text>
                  </View>
                  <Text style={styles.activeTripChevron}>›</Text>
                </View>
                <Text style={styles.activeTripTitle}>
                  {activeTrip.type === 'MORNING' ? 'Morning Route' : 'Afternoon Route'}
                </Text>
                <View style={styles.activeTripMeta}>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaValue}>{activeTrip.bus?.busNumber || '-'}</Text>
                    <Text style={styles.metaLabel}>Bus</Text>
                  </View>
                  <View style={styles.metaDivider} />
                  <View style={styles.metaItem}>
                    <Text style={styles.metaValue}>{activeTrip._count?.attendance || 0}</Text>
                    <Text style={styles.metaLabel}>Onboard</Text>
                  </View>
                  <View style={styles.metaDivider} />
                  <View style={styles.metaItem}>
                    <Text style={styles.metaValue}>{activeTrip.route?.name || '-'}</Text>
                    <Text style={styles.metaLabel}>Route</Text>
                  </View>
                </View>
                <View style={styles.activeTripActions}>
                  <View style={styles.actionBtnPrimary}>
                    <Text style={styles.actionBtnPrimaryText}>Navigate</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.actionBtnSos}
                    onPress={() => navigation.navigate('Emergency', { tripId: activeTrip.id })}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.actionBtnSosText}>SOS</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            )}

            {scheduledTrip && !activeTrip && (
              <TouchableOpacity
                style={styles.scheduledCard}
                onPress={() => navigation.navigate('ActiveTrip', { tripId: scheduledTrip.id })}
                activeOpacity={0.95}
              >
                <View style={styles.scheduledTop}>
                  <Text style={styles.scheduledLabel}>Next Trip</Text>
                  <Text style={styles.scheduledTime}>
                    {new Date(scheduledTrip.scheduledAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                <Text style={styles.scheduledTitle}>
                  {scheduledTrip.type === 'MORNING' ? 'Morning Route' : 'Afternoon Route'} · {scheduledTrip.bus?.busNumber || 'Bus'}
                </Text>
                {scheduledTrip.route && (
                  <Text style={styles.scheduledRoute}>{scheduledTrip.route.name}</Text>
                )}
                <View style={styles.startTripButton}>
                  <Text style={styles.startTripIcon}>▶</Text>
                  <Text style={styles.startTripText}>START TRIP</Text>
                </View>
              </TouchableOpacity>
            )}

            {!primaryTrip && (
              <View style={styles.noTripCard}>
                <Text style={styles.noTripEmoji}>🛑</Text>
                <Text style={styles.noTripTitle}>No Trips Scheduled</Text>
                <Text style={styles.noTripSub}>You have no trips today. Rest up!</Text>
              </View>
            )}

            {otherTrips.length > 0 && (
              <Text style={styles.sectionTitle}>
                {activeTrip ? 'Other Trips' : "Today's Schedule"}
              </Text>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.tripRow}
            onPress={() => navigation.navigate('ActiveTrip', { tripId: item.id })}
            activeOpacity={0.7}
          >
            <View style={[styles.tripDot, { backgroundColor: item.status === 'SCHEDULED' ? colors.info : colors.border }]} />
            <View style={styles.tripRowLeft}>
              <Text style={styles.tripRowType}>{item.type === 'MORNING' ? 'Morning' : 'Afternoon'}</Text>
              <Text style={styles.tripRowTime}>
                {new Date(item.scheduledAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
            <Text style={styles.tripRowBus}>{item.bus?.busNumber || '-'}</Text>
            <Text style={styles.tripRowRoute} numberOfLines={1}>{item.route?.name || ''}</Text>
          </TouchableOpacity>
        )}
        ListFooterComponent={<View style={{ height: 32 }} />}
      />

      <TouchableOpacity
        style={styles.fabSos}
        onPress={() => primaryTrip && navigation.navigate('Emergency', { tripId: primaryTrip.id })}
        activeOpacity={0.85}
      >
        <Text style={styles.fabSosText}>SOS</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  listContent: { paddingBottom: 80 },
  headerSection: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingTop: spacing.sm, marginBottom: spacing.md,
  },
  greeting: { fontSize: 15, color: colors.textSecondary, fontWeight: '500' },
  driverName: { fontSize: 26, fontWeight: '800', color: colors.text, marginTop: 1 },
  profileCircle: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  profileLetter: { color: '#fff', fontSize: 18, fontWeight: '700' },

  activeTripCard: {
    marginHorizontal: spacing.md, marginBottom: spacing.lg,
    backgroundColor: colors.primary, borderRadius: 24, padding: spacing.lg,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.35, shadowRadius: 20, elevation: 10,
  },
  activeTripTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  activeTripBadgeRow: { flexDirection: 'row', alignItems: 'center' },
  activePulse: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#4ade80', marginRight: 8 },
  activeTripBadge: { color: '#4ade80', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  activeTripChevron: { color: '#FFFFFFCC', fontSize: 24, fontWeight: '300' },
  activeTripTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '800', marginBottom: spacing.md },
  activeTripMeta: {
    flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16, padding: spacing.md, marginBottom: spacing.md,
  },
  metaItem: { flex: 1, alignItems: 'center' },
  metaValue: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  metaLabel: { color: '#FFFFFFB3', fontSize: 11, fontWeight: '500', marginTop: 2 },
  metaDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'center' },
  activeTripActions: { flexDirection: 'row', gap: spacing.sm },
  actionBtnPrimary: {
    flex: 1, backgroundColor: '#FFFFFF', borderRadius: 14, paddingVertical: 14, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
  },
  actionBtnPrimaryText: { color: colors.primary, fontSize: 16, fontWeight: '800' },
  actionBtnSos: {
    backgroundColor: '#ef4444', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 28, alignItems: 'center',
    shadowColor: '#ef4444', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
  },
  actionBtnSosText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },

  scheduledCard: {
    marginHorizontal: spacing.md, marginBottom: spacing.lg,
    backgroundColor: colors.surface, borderRadius: 24, padding: spacing.lg,
    borderWidth: 1.5, borderColor: colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3,
  },
  scheduledTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  scheduledLabel: { fontSize: 12, fontWeight: '700', color: colors.info, textTransform: 'uppercase', letterSpacing: 0.5 },
  scheduledTime: { fontSize: 14, fontWeight: '700', color: colors.textSecondary },
  scheduledTitle: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 4 },
  scheduledRoute: { fontSize: 14, color: colors.textSecondary, marginBottom: spacing.md },
  startTripButton: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    backgroundColor: colors.success, paddingVertical: 18, borderRadius: 16,
    shadowColor: colors.success, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 5,
  },
  startTripIcon: { fontSize: 18, marginRight: spacing.sm, color: '#FFFFFF' },
  startTripText: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', letterSpacing: 0.5 },

  noTripCard: {
    marginHorizontal: spacing.md, marginBottom: spacing.lg,
    backgroundColor: colors.surface, borderRadius: 24, padding: spacing.xl,
    alignItems: 'center', borderWidth: 1.5, borderColor: colors.border,
  },
  noTripEmoji: { fontSize: 48, marginBottom: spacing.sm },
  noTripTitle: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 4 },
  noTripSub: { fontSize: 14, color: colors.textSecondary },

  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.text, paddingHorizontal: spacing.md, marginBottom: spacing.sm, marginTop: spacing.xs },
  tripRow: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.md,
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  tripDot: { width: 10, height: 10, borderRadius: 5, marginRight: spacing.sm },
  tripRowLeft: { flex: 1 },
  tripRowType: { fontSize: 15, fontWeight: '600', color: colors.text },
  tripRowTime: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  tripRowBus: { fontSize: 13, fontWeight: '700', color: colors.text, marginRight: spacing.sm },
  tripRowRoute: { fontSize: 12, color: colors.textSecondary, maxWidth: 120 },

  fabSos: {
    position: 'absolute', bottom: 24, right: spacing.md,
    width: 56, height: 56, borderRadius: 28, backgroundColor: colors.error,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.error, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
  fabSosText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
});
