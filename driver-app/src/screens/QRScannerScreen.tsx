import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { colors, spacing, typography } from '../theme';
import { ScanQRResult } from '../types';
import * as studentsService from '../services/students';

type RootStackParamList = {
  Trips: undefined;
  TripDetail: { tripId: string };
  StudentList: { tripId: string };
  QRScanner: { tripId: string };
  IncidentReport: { tripId?: string };
};

type QRScannerRouteProp = RouteProp<RootStackParamList, 'QRScanner'>;

const QRScannerScreen: React.FC = () => {
  const route = useRoute<QRScannerRouteProp>();
  const navigation = useNavigation();
  const { tripId } = route.params;

  const [qrToken, setQrToken] = useState('');
  const [scanType, setScanType] = useState<'BOARD_IN' | 'EXIT_OUT'>('BOARD_IN');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanQRResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleScan = useCallback(async () => {
    const token = qrToken.trim();
    if (!token) {
      Alert.alert('Error', 'Please enter a QR token or scan a QR code.');
      return;
    }

    setScanning(true);
    try {
      const data = await studentsService.scanQR(token, tripId, scanType);
      setResult(data);
    } catch (e: any) {
      Alert.alert(
        'Scan Error',
        e?.response?.data?.message ||
          e?.message ||
          'Invalid or expired QR code.',
      );
    } finally {
      setScanning(false);
    }
  }, [qrToken, tripId, scanType]);

  const handleConfirm = async () => {
    if (!result) return;

    setSubmitting(true);
    try {
      await studentsService.scanQR(
        qrToken.trim(),
        tripId,
        scanType,
      );
      Alert.alert('Success', `${scanType === 'BOARD_IN' ? 'Boarding' : 'Exit'} recorded successfully!`, [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to record scan');
    } finally {
      setSubmitting(false);
    }
  };

  const switchScanType = () => {
    setScanType((prev) => (prev === 'BOARD_IN' ? 'EXIT_OUT' : 'BOARD_IN'));
    setResult(null);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.heading}>QR Scanner</Text>
        <Text style={styles.subtitle}>
          Scan a student's QR code to record attendance
        </Text>

        {!result && (
          <>
            <View style={styles.scanTypeToggle}>
              <TouchableOpacity
                style={[
                  styles.scanTypeButton,
                  scanType === 'BOARD_IN' && styles.scanTypeActive,
                ]}
                onPress={() => {
                  setScanType('BOARD_IN');
                  setResult(null);
                }}
              >
                <Text
                  style={[
                    styles.scanTypeText,
                    scanType === 'BOARD_IN' && styles.scanTypeTextActive,
                  ]}
                >
                  Board In
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.scanTypeButton,
                  scanType === 'EXIT_OUT' && styles.scanTypeActive,
                ]}
                onPress={() => {
                  setScanType('EXIT_OUT');
                  setResult(null);
                }}
              >
                <Text
                  style={[
                    styles.scanTypeText,
                    scanType === 'EXIT_OUT' && styles.scanTypeTextActive,
                  ]}
                >
                  Exit Out
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Camera QR Scanner</Text>
            <View style={styles.cameraPlaceholder}>
              <Text style={styles.cameraIcon}>📷</Text>
              <Text style={styles.cameraHint}>
                Camera view will appear here on device
              </Text>
              <Text style={styles.cameraHint}>
                (Use manual entry below as fallback)
              </Text>
            </View>

            <Text style={styles.label}>Manual QR Token Entry</Text>
            <TextInput
              style={styles.input}
              placeholder="Paste or type QR token"
              placeholderTextColor={colors.textSecondary}
              value={qrToken}
              onChangeText={setQrToken}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TouchableOpacity
              style={[styles.scanButton, scanning && styles.disabled]}
              onPress={handleScan}
              disabled={scanning}
            >
              {scanning ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.scanButtonText}>Verify QR Token</Text>
              )}
            </TouchableOpacity>
          </>
        )}

        {result && (
          <View style={styles.resultContainer}>
            <Text style={styles.successIcon}>✅</Text>
            <Text style={styles.resultHeading}>Student Found</Text>
            <View style={styles.studentInfo}>
              <Text style={styles.studentName}>
                {result.student.firstName} {result.student.lastName}
              </Text>
              <Text style={styles.studentDetail}>
                Grade {result.student.grade}
                {result.student.section ? ` • ${result.student.section}` : ''}
              </Text>
              <Text style={styles.studentDetail}>
                ID: {result.student.studentId}
              </Text>
            </View>
            <View style={styles.scanTypeToggle}>
              <TouchableOpacity
                style={[
                  styles.scanTypeButton,
                  scanType === 'BOARD_IN' && styles.scanTypeActive,
                ]}
                onPress={switchScanType}
              >
                <Text
                  style={[
                    styles.scanTypeText,
                    scanType === 'BOARD_IN' && styles.scanTypeTextActive,
                  ]}
                >
                  Board In
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.scanTypeButton,
                  scanType === 'EXIT_OUT' && styles.scanTypeActive,
                ]}
                onPress={switchScanType}
              >
                <Text
                  style={[
                    styles.scanTypeText,
                    scanType === 'EXIT_OUT' && styles.scanTypeTextActive,
                  ]}
                >
                  Exit Out
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.confirmButton, submitting && styles.disabled]}
              onPress={handleConfirm}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.confirmButtonText}>
                  Confirm {scanType === 'BOARD_IN' ? 'Boarding' : 'Exit'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    padding: spacing.md,
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
  scanTypeToggle: {
    flexDirection: 'row',
    backgroundColor: colors.border,
    borderRadius: 10,
    padding: 3,
    marginBottom: spacing.md,
  },
  scanTypeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  scanTypeActive: {
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  scanTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  scanTypeTextActive: {
    color: colors.primary,
  },
  cameraPlaceholder: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 180,
  },
  cameraIcon: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  cameraHint: {
    ...typography.caption,
    textAlign: 'center',
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
    marginBottom: spacing.md,
  },
  scanButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.7,
  },
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  resultHeading: {
    ...typography.h2,
    marginBottom: spacing.lg,
  },
  studentInfo: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  studentName: {
    ...typography.h3,
    marginBottom: spacing.xs,
  },
  studentDetail: {
    ...typography.caption,
    marginBottom: 2,
  },
  confirmButton: {
    backgroundColor: colors.secondary,
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});

export default QRScannerScreen;
