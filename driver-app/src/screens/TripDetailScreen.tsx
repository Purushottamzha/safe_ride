import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, typography } from '../theme';
import { Trip, Student, TripEvent } from '../types';
import * as tripsService from '../services/trips';
import * as studentsService from '../services/students';
import StatusBadge from '../components/StatusBadge';
import StudentCard from '../components/StudentCard';
import LoadingView from '../components/LoadingView';
import ErrorView from '../components/ErrorView';
import OfflineBanner from '../components/OfflineBanner';

type RootStackParamList = {
  Trips: undefined;
  TripDetail: { tripId: string };
  StudentList: { tripId: string };
  QRScanner: { tripId: string };
  IncidentReport: { tripId?: string };
};

type TripDetailRouteProp = RouteProp<RootStackParamList, 'TripDetail'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'TripDetail'>;

const TripDetailScreen: React.FC = () => {
  const route = useRoute<TripDetailRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { tripId } = route.params;

  const [trip, setTrip] = useState<Trip | null>(null);
  const [students, setStudents] = useState<(Student & { scanStatus?: TripEvent['scanType'] | null })[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setError('');
      const [tripData, studentsData] = await Promise.all([
        tripsService.getTripById(tripId),
        studentsService.getStudentsByTrip(tripId),
      ]);
      setTrip(tripData);
      setStudents(studentsData);
    } catch (e: any) {
      setError(e?.message || 'Failed to load trip details');
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAction = async (
    action: () => Promise<Trip>,
    successMessage: string,
  ) => {
    setActionLoading(true);
    try {
      const updated = await action();
      setTrip(updated);
      Alert.alert('Success', successMessage);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = () => {
    Alert.prompt
      ? Alert.prompt('Cancel Trip', 'Please provide a reason:', [
          { text: 'Don’t Cancel', style: 'cancel' },
          {
            text: 'Cancel Trip',
            style: 'destructive',
            onPress: (reason?: string) => {
              handleAction(
                () => tripsService.cancelTrip(tripId, reason || 'No reason provided'),
                'Trip cancelled',
              );
            },
          },
        ])
      : Alert.alert('Cancel Trip', 'Are you sure?', [
          { text: 'No', style: 'cancel' },
          {
            text: 'Yes',
            style: 'destructive',
            onPress: () =>
              handleAction(
                () => tripsService.cancelTrip(tripId, 'Cancelled by driver'),
                'Trip cancelled',
              ),
          },
        ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoadingView message="Loading trip details..." />
      </SafeAreaView>
    );
  }

  if (error || !trip) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorView message={error || 'Trip not found'} onRetry={fetchData} />
      </SafeAreaView>
    );
  }

  const formattedTime = new Date(trip.scheduledAt).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const tripType = trip.type === 'MORNING' ? 'Morning' : 'Afternoon';

  return (
    <SafeAreaView style={styles.safeArea}>
      <OfflineBanner />
      <FlatList
        data={students}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <StudentCard student={item} scanStatus={item.scanStatus || null} />
        )}
        ListHeaderComponent={
          <View>
            <View style={styles.headerCard}>
              <View style={styles.headerRow}>
                <Text style={styles.tripType}>{tripType} Trip</Text>
                <StatusBadge status={trip.status} />
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Scheduled</Text>
                <Text style={styles.infoValue}>{formattedTime}</Text>
              </View>
              {trip.bus && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Bus</Text>
                  <Text style={styles.infoValue}>
                    {trip.bus.busNumber} ({trip.bus.plateNumber})
                  </Text>
                </View>
              )}
              {trip.startedAt && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Started</Text>
                  <Text style={styles.infoValue}>
                    {new Date(trip.startedAt).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              )}
            </View>

            {actionLoading && (
              <View style={styles.actionLoading}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.actionLoadingText}>Processing...</Text>
              </View>
            )}

            <View style={styles.actions}>
              {trip.status === 'SCHEDULED' && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.startButton]}
                  onPress={() =>
                    handleAction(
                      () => tripsService.startTrip(tripId),
                      'Trip started',
                    )
                  }
                  disabled={actionLoading}
                >
                  <Text style={styles.actionButtonText}>Start Trip</Text>
                </TouchableOpacity>
              )}
              {trip.status === 'ACTIVE' && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.completeButton]}
                  onPress={() =>
                    handleAction(
                      () => tripsService.completeTrip(tripId),
                      'Trip completed',
                    )
                  }
                  disabled={actionLoading}
                >
                  <Text style={styles.actionButtonText}>Complete Trip</Text>
                </TouchableOpacity>
              )}
              {(trip.status === 'SCHEDULED' || trip.status === 'ACTIVE') && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={handleCancel}
                  disabled={actionLoading}
                >
                  <Text style={styles.actionButtonText}>Cancel Trip</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.scanSection}>
              <TouchableOpacity
                style={styles.scanButton}
                onPress={() =>
                  navigation.navigate('QRScanner', { tripId })
                }
                disabled={trip.status !== 'ACTIVE'}
              >
                <Text style={styles.scanButtonText}>Scan QR Code</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.reportButton}
                onPress={() =>
                  navigation.navigate('IncidentReport', { tripId })
                }
              >
                <Text style={styles.reportButtonText}>Report Incident</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Students ({students.length})
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyStudents}>
            <Text style={styles.emptyStudentsText}>No students assigned</Text>
          </View>
        }
        contentContainerStyle={styles.list}
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
  list: {
    paddingBottom: spacing.lg,
  },
  headerCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    margin: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  tripType: {
    ...typography.h2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  infoLabel: {
    ...typography.caption,
  },
  infoValue: {
    ...typography.body,
  },
  actionLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  actionLoadingText: {
    ...typography.caption,
    marginLeft: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: colors.secondary,
  },
  completeButton: {
    backgroundColor: colors.primary,
  },
  cancelButton: {
    backgroundColor: colors.error,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  scanSection: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  scanButton: {
    flex: 1,
    backgroundColor: colors.primaryDark,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  reportButton: {
    flex: 1,
    backgroundColor: colors.warning,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  reportButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  sectionHeader: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  sectionTitle: {
    ...typography.h3,
  },
  emptyStudents: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  emptyStudentsText: {
    ...typography.caption,
  },
});

export default TripDetailScreen;
