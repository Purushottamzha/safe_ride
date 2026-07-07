import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
  ActivityIndicator, Animated, Vibration, Dimensions, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { colors, spacing, typography } from '../theme';
import * as studentsService from '../services/students';
import { useToast } from '../components/Toast';

const { width } = Dimensions.get('window');

type RootStackParamList = {
  ActiveTrip: { tripId: string };
  QRScanner: { tripId: string; scanType?: 'BOARD_IN' | 'EXIT_OUT' };
};

type QRRouteProp = RouteProp<RootStackParamList, 'QRScanner'>;

interface ScanResult {
  student: { firstName: string; lastName: string; grade: string; studentId: string };
  timestamp: number;
}

export default function QRScannerScreen() {
  const route = useRoute<QRRouteProp>();
  const navigation = useNavigation();
  const { tripId } = route.params;

  const [scanType, setScanType] = useState<'BOARD_IN' | 'EXIT_OUT'>('BOARD_IN');
  const [scanning, setScanning] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [qrToken, setQrToken] = useState('');
  const [error, setError] = useState('');
  const [recentScans, setRecentScans] = useState<ScanResult[]>([]);
  const { showToast } = useToast();

  const successAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const lastScanRef = useRef('');

  const processScan = useCallback(async (token: string) => {
    const trimmed = token.trim();
    if (!trimmed || trimmed === lastScanRef.current) return;
    lastScanRef.current = trimmed;

    setScanning(true);
    setError('');
    try {
      const data = await studentsService.scanQR(trimmed, tripId, scanType);
      setRecentScans(prev => [{ student: data.student, timestamp: Date.now() }, ...prev]);
      showToast(`${data.student.firstName} ${data.student.lastName} scanned`, 'success');
      Vibration.vibrate(200);
      Animated.sequence([
        Animated.timing(successAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.delay(1500),
        Animated.timing(successAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Invalid QR';
      setError(msg);
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 40, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 40, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 10, duration: 40, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 40, useNativeDriver: true }),
      ]).start();
      setTimeout(() => setError(''), 2000);
    } finally {
      setScanning(false);
      setTimeout(() => { lastScanRef.current = ''; }, 1000);
    }
  }, [tripId, scanType, successAnim, shakeAnim]);

  const handleManualScan = async () => {
    if (!qrToken.trim()) { Alert.alert('Error', 'Enter a QR token'); return; }
    await processScan(qrToken);
    setQrToken('');
  };

  const switchScanType = () => {
    setScanType(prev => prev === 'BOARD_IN' ? 'EXIT_OUT' : 'BOARD_IN');
    setError('');
    setQrToken('');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.scanTypeRow}>
          <TouchableOpacity style={[styles.typeBtn, scanType === 'BOARD_IN' && styles.typeBtnActive]} onPress={() => { setScanType('BOARD_IN'); setError(''); }}>
            <Text style={[styles.typeBtnText, scanType === 'BOARD_IN' && styles.typeBtnTextActive]}>Board In</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.typeBtn, scanType === 'EXIT_OUT' && styles.typeBtnActive]} onPress={() => { setScanType('EXIT_OUT'); setError(''); }}>
            <Text style={[styles.typeBtnText, scanType === 'EXIT_OUT' && styles.typeBtnTextActive]}>Drop Off</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.scannerArea}>
          <Text style={styles.scannerIcon}>📷</Text>
          <Text style={styles.scannerTitle}>Continuous Scan Mode</Text>
          <Text style={styles.scannerHint}>Point camera at student QR code</Text>
          {scanning && <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.sm }} />}
          <Animated.View style={[styles.successOverlay, { opacity: successAnim }]}>
            <Text style={styles.successCheck}>✓</Text>
            <Text style={styles.successText}>Scanned!</Text>
          </Animated.View>
          {error ? (
            <Animated.View style={[styles.errorBanner, { transform: [{ translateX: shakeAnim }] }]}>
              <Text style={styles.errorText}>{error}</Text>
            </Animated.View>
          ) : null}
        </View>

        <TouchableOpacity style={styles.manualToggle} onPress={() => setManualMode(!manualMode)}>
          <Text style={styles.manualToggleText}>
            {manualMode ? 'Show Scanner' : 'Manual Entry'}
          </Text>
        </TouchableOpacity>

        {manualMode && (
          <View style={styles.manualSection}>
            <TextInput
              style={styles.input}
              placeholder="Enter QR token"
              placeholderTextColor={colors.textSecondary}
              value={qrToken}
              onChangeText={setQrToken}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!scanning}
            />
            <TouchableOpacity style={[styles.manualBtn, scanning && { opacity: 0.7 }]} onPress={handleManualScan} disabled={scanning}>
              {scanning ? <ActivityIndicator color="#FFF" /> : <Text style={styles.manualBtnText}>Verify</Text>}
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.recentHeader}>
          <Text style={styles.recentTitle}>Recent Scans ({recentScans.length})</Text>
          <TouchableOpacity onPress={switchScanType}>
            <Text style={styles.switchText}>Switch to {scanType === 'BOARD_IN' ? 'Drop Off' : 'Board In'}</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={recentScans}
          keyExtractor={(_, i) => String(i)}
          showsVerticalScrollIndicator={false}
          style={styles.recentList}
          renderItem={({ item, index }) => (
            <View style={styles.scanRow}>
              <View style={[styles.scanBadge, { backgroundColor: scanType === 'BOARD_IN' ? colors.success : colors.info }]}>
                <Text style={styles.scanBadgeText}>{recentScans.length - index}</Text>
              </View>
              <View style={styles.scanInfo}>
                <Text style={styles.scanName}>{item.student.firstName} {item.student.lastName}</Text>
                <Text style={styles.scanDetail}>Grade {item.student.grade} · ID: {item.student.studentId.slice(0, 8)}</Text>
              </View>
              <Text style={styles.scanTime}>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</Text>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyScans}>No scans yet. Scan a student QR code to begin.</Text>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#000' },
  container: { flex: 1, padding: spacing.md },
  scanTypeRow: { flexDirection: 'row', backgroundColor: '#1E293B', borderRadius: 12, padding: 4, marginBottom: spacing.md },
  typeBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  typeBtnActive: { backgroundColor: colors.primary },
  typeBtnText: { fontSize: 15, fontWeight: '600', color: colors.textSecondary },
  typeBtnTextActive: { color: '#FFFFFF' },
  scannerArea: {
    backgroundColor: '#0F172A', borderRadius: 16, padding: spacing.lg,
    alignItems: 'center', minHeight: 200, justifyContent: 'center',
    borderWidth: 2, borderColor: colors.primary + '40', borderStyle: 'dashed', marginBottom: spacing.sm,
    position: 'relative', overflow: 'hidden',
  },
  scannerIcon: { fontSize: 56, marginBottom: spacing.sm },
  scannerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', marginBottom: spacing.xs },
  scannerHint: { color: colors.textSecondary, fontSize: 14 },
  successOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.success + 'CC', justifyContent: 'center', alignItems: 'center', borderRadius: 16 },
  successCheck: { fontSize: 64, color: '#FFFFFF', fontWeight: '800' },
  successText: { color: '#FFFFFF', fontSize: 20, fontWeight: '700', marginTop: spacing.xs },
  errorBanner: { backgroundColor: colors.error + '30', borderRadius: 8, padding: spacing.sm, marginTop: spacing.sm, borderWidth: 1, borderColor: colors.error + '50' },
  errorText: { color: colors.error, fontSize: 14, textAlign: 'center', fontWeight: '600' },
  manualToggle: { alignItems: 'center', paddingVertical: spacing.sm, marginBottom: spacing.sm },
  manualToggleText: { color: colors.info, fontSize: 14, fontWeight: '600' },
  manualSection: { marginBottom: spacing.md },
  input: { backgroundColor: '#1E293B', borderRadius: 10, paddingHorizontal: spacing.md, paddingVertical: 14, fontSize: 16, color: '#FFFFFF', marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  manualBtn: { backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  manualBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  recentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm, marginTop: spacing.sm },
  recentTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  switchText: { color: colors.info, fontSize: 12, fontWeight: '600' },
  recentList: { flex: 1 },
  scanRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E293B', borderRadius: 10, padding: spacing.sm, marginBottom: 6 },
  scanBadge: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  scanBadgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  scanInfo: { flex: 1 },
  scanName: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  scanDetail: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  scanTime: { color: colors.textSecondary, fontSize: 11, fontFamily: 'monospace' },
  emptyScans: { color: colors.textSecondary, textAlign: 'center', paddingVertical: spacing.xl, fontSize: 14 },
});
