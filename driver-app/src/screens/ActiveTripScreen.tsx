import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, Alert, ActivityIndicator, TouchableOpacity,
  ScrollView, Animated, Dimensions, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, typography } from '../theme';
import { Trip, Student } from '../types';
import * as tripsService from '../services/trips';
import * as studentsService from '../services/students';
import { startTracking, stopTracking, isTracking } from '../services/location';
import { useOfflineStore } from '../store/offlineStore';

const { width } = Dimensions.get('window');

type RootStackParamList = {
  Home: undefined;
  ActiveTrip: { tripId: string };
  QRScanner: { tripId: string; scanType?: 'BOARD_IN' | 'EXIT_OUT' };
  EndTripSummary: { tripId: string; stats?: any };
  Emergency: { tripId: string };
};

type RouteProps = RouteProp<RootStackParamList, 'ActiveTrip'>;
type NavProps = NativeStackNavigationProp<RootStackParamList, 'ActiveTrip'>;

export default function ActiveTripScreen() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavProps>();
  const { tripId } = route.params;
  const isOnline = useOfflineStore(s => s.isOnline);

  const [trip, setTrip] = useState<Trip | null>(null);
  const [students, setStudents] = useState<(Student & { scanStatus?: string | null })[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [tracking, setTracking] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const scannedCount = students.filter(s => s.scanStatus).length;
  const totalStudents = students.length;
  const progressPct = totalStudents > 0 ? scannedCount / totalStudents : 0;

  useEffect(() => {
    if (trip?.status === 'ACTIVE') {
      const anim = Animated.loop(Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ]));
      anim.start();
      return () => anim.stop();
    }
  }, [trip?.status, pulseAnim]);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progressPct,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [progressPct, progressAnim]);

  const fetchData = useCallback(async () => {
    try {
      const [tripData, studentsData] = await Promise.all([
        tripsService.getTripById(tripId),
        studentsService.getStudentsByTrip(tripId),
      ]);
      setTrip(tripData);
      setStudents(studentsData);
      if (tripData.status === 'ACTIVE') setTracking(isTracking());
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [tripId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleStart = async () => {
    setActionLoading(true);
    try {
      const updated = await tripsService.startTrip(tripId);
      setTrip(updated);
      await startTracking(tripId);
      setTracking(true);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to start trip');
    } finally { setActionLoading(false); }
  };

  const handleEnd = () => {
    Alert.alert('End Trip', 'Finish this trip and mark all students as dropped?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End Trip', style: 'destructive', onPress: async () => {
          setActionLoading(true);
          try {
            const updated = await tripsService.completeTrip(tripId);
            setTrip(updated);
            stopTracking();
            setTracking(false);
            navigation.replace('EndTripSummary', {
              tripId,
              stats: { students: totalStudents, scanned: scannedCount, duration: '' },
            });
          } catch (e: any) {
            Alert.alert('Error', e?.message || 'Failed to end trip');
          } finally { setActionLoading(false); }
        },
      },
    ]);
  };

  if (loading) return (
    <SafeAreaView style={styles.safeArea}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={{ marginTop: spacing.md, color: colors.textSecondary }}>Loading trip...</Text>
      </View>
    </SafeAreaView>
  );

  if (!trip) return (
    <SafeAreaView style={styles.safeArea}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 48, marginBottom: spacing.sm }}>🚌</Text>
        <Text style={{ fontSize: 16, fontWeight: '600', color: colors.textSecondary }}>Trip not found</Text>
      </View>
    </SafeAreaView>
  );

  const isActive = trip.status === 'ACTIVE';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.statusBar}>
          <Animated.View style={[styles.statusDot, { opacity: isActive ? pulseAnim : 0.5, backgroundColor: isActive ? colors.success : colors.info }]} />
          <View>
            <Text style={[styles.statusLabel, { color: isActive ? colors.success : colors.info }]}>
              {isActive ? 'Trip Active' : 'Ready to Start'}
            </Text>
            <Text style={styles.tripType}>{trip.type === 'MORNING' ? 'Morning Route' : 'Afternoon Route'}</Text>
          </View>
          <View style={{ flex: 1 }} />
          {trip.route && (
            <Text style={styles.routeName} numberOfLines={1}>{trip.route.name}</Text>
          )}
        </View>

        <View style={styles.busHero}>
          <Text style={styles.busNumber}>{trip.bus?.busNumber || 'Bus'}</Text>
          <Text style={styles.busPlate}>{trip.bus?.plateNumber || ''}</Text>
        </View>

        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Student Boarding</Text>
            <Text style={[styles.progressCount, { color: scannedCount === totalStudents && totalStudents > 0 ? colors.success : colors.primary }]}>
              {scannedCount}/{totalStudents}
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, {
              width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
              backgroundColor: scannedCount === totalStudents && totalStudents > 0 ? colors.success : colors.primary,
            }]} />
          </View>
          {tracking && (
            <View style={styles.gpsRow}>
              <View style={styles.gpsDot} />
              <Text style={styles.gpsText}>GPS tracking active</Text>
            </View>
          )}
        </View>

        {isActive ? (
          <View style={styles.actionGrid}>
            <TouchableOpacity
              style={styles.primaryAction}
              onPress={() => navigation.navigate('QRScanner', { tripId })}
              activeOpacity={0.9}
            >
              <Text style={styles.primaryActionIcon}>📷</Text>
              <Text style={styles.primaryActionLabel}>Scan QR</Text>
              <Text style={styles.primaryActionSub}>Tap to scan students</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sosAction}
              onPress={() => navigation.navigate('Emergency', { tripId })}
              activeOpacity={0.9}
            >
              <Text style={styles.sosActionIcon}>🆘</Text>
              <Text style={styles.sosActionLabel}>SOS</Text>
              <Text style={styles.sosActionSub}>Emergency</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.startBtn} onPress={handleStart} disabled={actionLoading} activeOpacity={0.9}>
            {actionLoading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                <Text style={styles.startBtnIcon}>▶</Text>
                <Text style={styles.startBtnLabel}>START TRIP</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {isActive && (
          <TouchableOpacity style={styles.endBtn} onPress={handleEnd} disabled={actionLoading} activeOpacity={0.9}>
            {actionLoading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.endBtnLabel}>END TRIP</Text>
            )}
          </TouchableOpacity>
        )}

        <View style={styles.studentSection}>
          <Text style={styles.sectionTitle}>Students ({totalStudents})</Text>
          <View style={styles.studentSummary}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{scannedCount}</Text>
              <Text style={styles.summaryLabel}>Boarded</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{totalStudents - scannedCount}</Text>
              <Text style={styles.summaryLabel}>Remaining</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{Math.round(progressPct * 100)}%</Text>
              <Text style={styles.summaryLabel}>Progress</Text>
            </View>
          </View>
        </View>

        {students.map(s => (
          <View key={s.id} style={[styles.studentRow, s.scanStatus && styles.studentRowDone]}>
            <View style={[styles.studentAvatar, { backgroundColor: s.scanStatus ? colors.success + '20' : colors.border }]}>
              <Text style={[styles.studentAvatarText, { color: s.scanStatus ? colors.success : colors.textSecondary }]}>
                {s.firstName[0]}{s.lastName[0]}
              </Text>
            </View>
            <View style={styles.studentInfo}>
              <Text style={styles.studentName}>{s.firstName} {s.lastName}</Text>
              <Text style={styles.studentGrade}>Grade {s.grade}{s.section ? ` · ${s.section}` : ''}</Text>
            </View>
            {s.scanStatus ? (
              <View style={styles.scannedBadge}>
                <Text style={styles.scannedBadgeText}>✓</Text>
              </View>
            ) : (
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingBadgeText}>⋯</Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: spacing.xl * 2 },
  statusBar: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md,
    paddingVertical: spacing.md, gap: spacing.sm,
  },
  statusDot: { width: 14, height: 14, borderRadius: 7 },
  statusLabel: { fontSize: 16, fontWeight: '800' },
  tripType: { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },
  routeName: { fontSize: 12, color: colors.textSecondary, maxWidth: 120 },

  busHero: { alignItems: 'center', paddingVertical: spacing.md },
  busNumber: { fontSize: 44, fontWeight: '800', color: colors.text },
  busPlate: { fontSize: 14, color: colors.textSecondary, fontWeight: '500', marginTop: 2 },

  progressCard: {
    backgroundColor: colors.surface, borderRadius: 20, marginHorizontal: spacing.md,
    marginBottom: spacing.md, padding: spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3,
    borderWidth: 1, borderColor: colors.border,
  },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  progressTitle: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  progressCount: { fontSize: 22, fontWeight: '800' },
  progressTrack: { height: 10, backgroundColor: colors.border, borderRadius: 5, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 5 },
  gpsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: spacing.sm, gap: 6 },
  gpsDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success },
  gpsText: { fontSize: 12, color: colors.success, fontWeight: '600' },

  actionGrid: { flexDirection: 'row', paddingHorizontal: spacing.md, gap: spacing.sm, marginBottom: spacing.md },
  primaryAction: {
    flex: 2, backgroundColor: colors.primary, borderRadius: 20, padding: spacing.lg, alignItems: 'center',
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 6,
  },
  primaryActionIcon: { fontSize: 40, marginBottom: spacing.xs },
  primaryActionLabel: { color: '#FFFFFF', fontSize: 20, fontWeight: '800' },
  primaryActionSub: { color: '#FFFFFFB3', fontSize: 12, marginTop: 2 },
  sosAction: {
    flex: 1, backgroundColor: colors.error, borderRadius: 20, padding: spacing.lg, alignItems: 'center',
    shadowColor: colors.error, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 6,
  },
  sosActionIcon: { fontSize: 28, marginBottom: spacing.xs },
  sosActionLabel: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  sosActionSub: { color: '#FFFFFFB3', fontSize: 11, marginTop: 2 },

  startBtn: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    backgroundColor: colors.success, marginHorizontal: spacing.md, marginBottom: spacing.md,
    paddingVertical: 22, borderRadius: 20,
    shadowColor: colors.success, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
  },
  startBtnIcon: { fontSize: 22, color: '#FFFFFF', marginRight: spacing.sm },
  startBtnLabel: { color: '#FFFFFF', fontSize: 22, fontWeight: '800', letterSpacing: 0.5 },

  endBtn: {
    backgroundColor: colors.error, marginHorizontal: spacing.md, marginBottom: spacing.lg,
    paddingVertical: 18, borderRadius: 18, alignItems: 'center',
    shadowColor: colors.error, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5,
  },
  endBtnLabel: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },

  studentSection: { paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  studentSummary: {
    flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 16,
    padding: spacing.md, alignItems: 'center', borderWidth: 1, borderColor: colors.border,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: { fontSize: 24, fontWeight: '800', color: colors.text },
  summaryLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 2, fontWeight: '500' },
  summaryDivider: { width: 1, height: 36, backgroundColor: colors.border },

  studentRow: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.md,
    paddingVertical: 12, paddingHorizontal: spacing.sm,
    borderRadius: 14, marginBottom: 6, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
  },
  studentRowDone: { opacity: 0.65 },
  studentAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  studentAvatarText: { fontSize: 13, fontWeight: '700' },
  studentInfo: { flex: 1 },
  studentName: { fontSize: 15, fontWeight: '600' },
  studentGrade: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  scannedBadge: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center' },
  scannedBadgeText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  pendingBadge: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  pendingBadgeText: { color: colors.textSecondary, fontSize: 15, fontWeight: '700' },
});
