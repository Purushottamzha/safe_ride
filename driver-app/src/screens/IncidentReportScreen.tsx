import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
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

type IncidentReportRouteProp = RouteProp<RootStackParamList, 'IncidentReport'>;

const severities: { label: string; value: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' }[] = [
  { label: 'Low', value: 'LOW' },
  { label: 'Medium', value: 'MEDIUM' },
  { label: 'High', value: 'HIGH' },
  { label: 'Critical', value: 'CRITICAL' },
];

const IncidentReportScreen: React.FC = () => {
  const route = useRoute<IncidentReportRouteProp>();
  const navigation = useNavigation();
  const tripId = route.params?.tripId;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');
  const [location, setLocation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title for the incident.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description.');
      return;
    }

    setSubmitting(true);
    try {
      await incidentsService.createIncident({
        title: title.trim(),
        description: description.trim(),
        severity,
        location: location.trim() || undefined,
        tripId,
      });
      setSubmitted(true);
    } catch (e: any) {
      Alert.alert(
        'Error',
        e?.response?.data?.message || e?.message || 'Failed to submit incident report.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.successContainer}>
          <Text style={styles.successIcon}>✅</Text>
          <Text style={styles.successTitle}>Incident Reported</Text>
          <Text style={styles.successText}>
            Your incident report has been submitted successfully.
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.heading}>Report Incident</Text>
        <Text style={styles.subtitle}>
          Report safety concerns or incidents during your trip
        </Text>

        <Text style={styles.label}>Title *</Text>
        <TextInput
          style={styles.input}
          placeholder="What happened?"
          placeholderTextColor={colors.textSecondary}
          value={title}
          onChangeText={setTitle}
          editable={!submitting}
        />

        <Text style={styles.label}>Severity *</Text>
        <View style={styles.severityRow}>
          {severities.map((s) => (
            <TouchableOpacity
              key={s.value}
              style={[
                styles.severityButton,
                severity === s.value && {
                  backgroundColor:
                    s.value === 'LOW'
                      ? colors.success + '20'
                      : s.value === 'MEDIUM'
                      ? colors.warning + '20'
                      : s.value === 'HIGH'
                      ? colors.error + '20'
                      : '#7C3AED' + '20',
                  borderColor:
                    s.value === 'LOW'
                      ? colors.success
                      : s.value === 'MEDIUM'
                      ? colors.warning
                      : s.value === 'HIGH'
                      ? colors.error
                      : '#7C3AED',
                },
              ]}
              onPress={() => setSeverity(s.value)}
              disabled={submitting}
            >
              <Text
                style={[
                  styles.severityText,
                  severity === s.value && {
                    color:
                      s.value === 'LOW'
                        ? colors.success
                        : s.value === 'MEDIUM'
                        ? colors.warning
                        : s.value === 'HIGH'
                        ? colors.error
                        : '#7C3AED',
                  },
                ]}
              >
                {s.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Description *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Provide details about the incident..."
          placeholderTextColor={colors.textSecondary}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
          editable={!submitting}
        />

        <Text style={styles.label}>Location (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter location or address"
          placeholderTextColor={colors.textSecondary}
          value={location}
          onChangeText={setLocation}
          editable={!submitting}
        />

        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.disabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Report</Text>
          )}
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
  label: {
    ...typography.label,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
  },
  textArea: {
    minHeight: 120,
    paddingTop: 14,
  },
  severityRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  severityButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  severityText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  submitButton: {
    backgroundColor: colors.error,
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.7,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  successIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  successTitle: {
    ...typography.h2,
    marginBottom: spacing.sm,
  },
  successText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 10,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default IncidentReportScreen;
