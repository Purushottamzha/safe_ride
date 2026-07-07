import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { colors, spacing, typography } from '../theme';
import * as incidentsService from '../services/incidents';

type RootStackParamList = {
  Home: undefined;
  ActiveTrip: { tripId: string };
  QRScanner: { tripId: string; scanType?: 'BOARD_IN' | 'EXIT_OUT' };
  EndTripSummary: { tripId: string; stats?: any };
  IncidentReport: { tripId?: string };
  Emergency: { tripId: string };
};

type EmergencyRouteProp = RouteProp<RootStackParamList, 'Emergency'>;

interface EmergencyAction {
  id: string;
  label: string;
  icon: string;
  color: string;
  bgColor: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
}

const emergencyActions: EmergencyAction[] = [
  {
    id: 'sos',
    label: 'SOS Emergency',
    icon: '🆘',
    color: '#FFFFFF',
    bgColor: '#DC2626',
    severity: 'CRITICAL',
    description: 'Immediate assistance required. Admin and all guardians will be notified.',
  },
  {
    id: 'breakdown',
    label: 'Vehicle Breakdown',
    icon: '🔧',
    color: '#1E293B',
    bgColor: '#F59E0B',
    severity: 'HIGH',
    description: 'Vehicle has broken down. Admin will be notified to arrange replacement.',
  },
  {
    id: 'delay',
    label: 'Route Delay',
    icon: '⏰',
    color: '#FFFFFF',
    bgColor: '#3B82F6',
    severity: 'MEDIUM',
    description: 'Trip is delayed. Parents and admin will be notified about the delay.',
  },
  {
    id: 'medical',
    label: 'Medical Emergency',
    icon: '🏥',
    color: '#FFFFFF',
    bgColor: '#7C3AED',
    severity: 'CRITICAL',
    description: 'Medical emergency on board. Admin and emergency contacts will be alerted.',
  },
];

const EmergencyScreen: React.FC = () => {
  const route = useRoute<EmergencyRouteProp>();
  const navigation = useNavigation();
  const { tripId } = route.params;

  const [submitting, setSubmitting] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<string | null>(null);

  const handleEmergency = (action: EmergencyAction) => {
    Alert.alert(
      action.label,
      action.description + '\n\nAre you sure you want to send this alert?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Alert',
          style: 'destructive',
          onPress: () => sendEmergency(action),
        },
      ],
    );
  };

  const sendEmergency = async (action: EmergencyAction) => {
    setSubmitting(action.id);
    try {
      await incidentsService.createIncident({
        title: action.label,
        description: action.description,
        severity: action.severity,
        tripId,
        location: 'Current location',
      });
      setSubmitted(action.id);
      setTimeout(() => {
        setSubmitted(null);
        navigation.goBack();
      }, 2000);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || e?.message || 'Failed to send alert');
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.heading}>Emergency Actions</Text>
        <Text style={styles.subtitle}>
          Send immediate alerts to admin and affected parents
        </Text>

        {emergencyActions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={[
              styles.emergencyCard,
              { backgroundColor: action.bgColor },
              submitted === action.id && styles.submittedCard,
            ]}
            onPress={() => handleEmergency(action)}
            disabled={submitting !== null}
            activeOpacity={0.8}
          >
            {submitted === action.id ? (
              <View style={styles.submittedContent}>
                <Text style={styles.submittedIcon}>✅</Text>
                <Text style={styles.submittedText}>Alert Sent!</Text>
              </View>
            ) : (
              <View style={styles.emergencyContent}>
                <Text style={styles.emergencyIcon}>{action.icon}</Text>
                <View style={styles.emergencyInfo}>
                  <Text style={[styles.emergencyLabel, { color: action.color }]}>
                    {action.label}
                  </Text>
                  <Text style={[styles.emergencyDesc, { color: action.color + 'CC' }]}>
                    {action.description}
                  </Text>
                </View>
                {submitting === action.id ? (
                  <ActivityIndicator color={action.color} size="small" />
                ) : (
                  <Text style={[styles.emergencyArrow, { color: action.color }]}>→</Text>
                )}
              </View>
            )}
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          disabled={submitting !== null}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  heading: {
    ...typography.h1,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.caption,
    marginBottom: spacing.lg,
  },
  emergencyCard: {
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    minHeight: 80,
    justifyContent: 'center',
  },
  emergencyContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submittedCard: {
    opacity: 0.8,
  },
  submittedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submittedIcon: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  submittedText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  emergencyIcon: {
    fontSize: 36,
    marginRight: spacing.md,
  },
  emergencyInfo: {
    flex: 1,
  },
  emergencyLabel: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
  },
  emergencyDesc: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  emergencyArrow: {
    fontSize: 24,
    fontWeight: '700',
    marginLeft: spacing.sm,
  },
  backButton: {
    backgroundColor: colors.surface,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
});

export default EmergencyScreen;
