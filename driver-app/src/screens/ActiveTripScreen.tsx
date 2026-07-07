import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, Alert, ActivityIndicator, TouchableOpacity,
  ScrollView, Animated, Vibration, Dimensions,
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

  const scannedCount = students.filter(s => s.scanStatus).length;
  const totalStudents = students.length;

  useEffect(() => {
    if (trip?.status === 'ACTIVE') {
      const anim = Animated.loop(Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ]));
      anim.start();
      return () => anim.stop();
    }
  }, [trip?.status, pulseAnim]);

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

  if (loading) return <SafeAreaView style={styles.safeArea}><ActivityIndicator color={colors.primary} size="large" style={{ flex: 1 }} /></SafeAreaView>;
  if (!trip) return <SafeAreaView style={styles.safeArea}><Text style={{ textAlign: 'center', marginTop: 100 }}>Trip not found</Text></SafeAreaView>;

  const isActive = trip.status === 'ACTIVE';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.statusSection}>
          <Animated.View style={[styles.statusDot, { opacity: isActive ? pulseAnim : 1 }]} />
          <Text style={styles.statusLabel}>{isActive ? 'Trip Active' : 'Ready to Start'}</Text>
          <Text style={styles.tripType}>{trip.type === 'MORNING' ? 'Morning Route' : 'Afternoon Route'}</Text>
          <Text style={styles.busNumber}>{trip.bus?.busNumber || 'Bus'}</Text>
          {trip.route && <Text style={styles.routeName}>{trip.route.name}</Text>}
        </View>

        {isActive && (
          <View style={styles.progressCard}>
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>Students</Text>
              <Text style={[styles.progressValue, { color: scannedCount === totalStudents ? colors.success : colors.primary }]}>
                {scannedCount} / {totalStudents}
              </Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${totalStudents > 0 ? (scannedCount / totalStudents) * 100 : 0}%`, backgroundColor: scannedCount === totalStudents ? colors.success : colors.primary }]} />
            </View>
            {tracking && <Text style={styles.trackingText}>📍 GPS active</Text>}
          </View>
        )}

        {isActive ? (
          <View style={styles.actionGrid}>
            <TouchableOpacity style={styles.actionScan} onPress={() => navigation.navigate('QRScanner', { tripId })} activeOpacity={0.85}>
              <Text style={styles.actionScanIcon}>📷</Text>
              <Text style={styles.actionScanLabel}>Scan QR</Text>
              <Text style={styles.actionScanSub}>Continuous scan mode</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionSos} onPress={() => navigation.navigate('Emergency', { tripId })} activeOpacity={0.85}>
              <Text style={styles.actionSosIcon}>🆘</Text>
              <Text style={styles.actionSosLabel}>SOS</Text>
              <Text style={styles.actionSosSub}>Emergency</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.startButton} onPress={handleStart} disabled={actionLoading} activeOpacity={0.85}>
            {actionLoading ? <ActivityIndicator color="#FFF" size="small" /> : (
              <>
                <Text style={styles.startIcon}>▶</Text>
                <Text style={styles.startLabel}>START TRIP</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {isActive && (
          <TouchableOpacity style={styles.endButton} onPress={handleEnd} disabled={actionLoading} activeOpacity={0.85}>
            {actionLoading ? <ActivityIndicator color="#FFF" size="small" /> : (
              <Text style={styles.endLabel}>END TRIP</Text>
            )}
          </TouchableOpacity>
        )}

        <Text style={styles.sectionTitle}>Students ({totalStudents})</Text>
        <View style={styles.studentSummary}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryCount}>{scannedCount}</Text>
            <Text style={styles.summaryLabel}>Boarded</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryCount}>{totalStudents - scannedCount}</Text>
            <Text style={styles.summaryLabel}>Remaining</Text>
          </View>
        </View>

        {students.map(s => (
          <View key={s.id} style={[styles.studentRow, !!s.scanStatus && styles.studentRowDone]}>
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
  scroll: { paddingBottom: spacing.xl },
  statusSection: { alignItems: 'center', paddingVertical: spacing.lg, paddingHorizontal: spacing.md },
  statusDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.success, marginBottom: spacing.sm },
  statusLabel: { fontSize: 22, fontWeight: '800', color: colors.success, marginBottom: 4 },
  tripType: { fontSize: 15, color: colors.textSecondary, marginBottom: spacing.xs },
  busNumber: { fontSize: 40, fontWeight: '800', color: colors.text, marginBottom: 4 },
  routeName: { fontSize: 14, color: colors.textSecondary },
  progressCard: {
    backgroundColor: colors.surface, borderRadius: 16, marginHorizontal: spacing.md, marginBottom: spacing.md,
    padding: spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  progressLabel: { ...typography.caption, fontWeight: '600' },
  progressValue: { fontSize: 18, fontWeight: '800' },
  progressTrack: { height: 10, backgroundColor: colors.border, borderRadius: 5, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 5 },
  trackingText: { fontSize: 12, color: colors.success, fontWeight: '600', textAlign: 'center', marginTop: spacing.sm },
  actionGrid: { flexDirection: 'row', paddingHorizontal: spacing.md, gap: spacing.sm, marginBottom: spacing.md },
  actionScan: {
    flex: 1.6, backgroundColor: colors.primary, borderRadius: 16, padding: spacing.lg, alignItems: 'center',
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5,
  },
  actionScanIcon: { fontSize: 36, marginBottom: spacing.xs },
  actionScanLabel: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  actionScanSub: { color: '#FFFFFFB3', fontSize: 11, marginTop: 2 },
  actionSos: {
    flex: 1, backgroundColor: colors.error, borderRadius: 16, padding: spacing.lg, alignItems: 'center',
    shadowColor: colors.error, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5,
  },
  actionSosIcon: { fontSize: 28, marginBottom: spacing.xs },
  actionSosLabel: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  actionSosSub: { color: '#FFFFFFB3', fontSize: 11, marginTop: 2 },
  startButton: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    backgroundColor: colors.success, marginHorizontal: spacing.md, marginBottom: spacing.md,
    paddingVertical: 22, borderRadius: 16,
    shadowColor: colors.success, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  startIcon: { fontSize: 22, color: '#FFFFFF', marginRight: spacing.sm },
  startLabel: { color: '#FFFFFF', fontSize: 22, fontWeight: '800', letterSpacing: 1 },
  endButton: {
    backgroundColor: colors.error, marginHorizontal: spacing.md, marginBottom: spacing.lg,
    paddingVertical: 16, borderRadius: 14, alignItems: 'center',
  },
  endLabel: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  sectionTitle: { ...typography.h3, paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  studentSummary: {
    flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 14,
    marginHorizontal: spacing.md, marginBottom: spacing.md, padding: spacing.md,
    alignItems: 'center',
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryCount: { fontSize: 28, fontWeight: '800', color: colors.text },
  summaryLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  summaryDivider: { width: 1, height: 40, backgroundColor: colors.border },
  studentRow: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.md,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.sm,
    borderRadius: 12, marginBottom: 4, backgroundColor: colors.surface,
  },
  studentRowDone: { opacity: 0.7 },
  studentAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  studentAvatarText: { fontSize: 12, fontWeight: '700' },
  studentInfo: { flex: 1 },
  studentName: { fontSize: 14, fontWeight: '600' },
  studentGrade: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  scannedBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center' },
  scannedBadgeText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  pendingBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  pendingBadgeText: { color: colors.textSecondary, fontSize: 14, fontWeight: '700' },
});
