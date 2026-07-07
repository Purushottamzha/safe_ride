import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing } from '../theme';

type RootStackParamList = {
  Home: undefined;
  EndTripSummary: { tripId: string; stats?: { students?: number; scanned?: number; duration?: string } };
};

type RouteProps = RouteProp<RootStackParamList, 'EndTripSummary'>;
type NavProps = NativeStackNavigationProp<RootStackParamList, 'EndTripSummary'>;

export default function EndTripSummaryScreen() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavProps>();
  const stats = route.params?.stats || {};
  const students = stats.students ?? 0;
  const scanned = stats.scanned ?? 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.checkmark}>✅</Text>
        <Text style={styles.title}>Trip Complete</Text>
        <Text style={styles.subtitle}>Great job today!</Text>

        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{students}</Text>
            <Text style={styles.statLabel}>Students</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{scanned}</Text>
            <Text style={styles.statLabel}>Scanned</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{students > 0 ? Math.round((scanned / students) * 100) : 0}%</Text>
            <Text style={styles.statLabel}>Coverage</Text>
          </View>
        </View>

        <View style={styles.safetyCard}>
          <Text style={styles.safetyTitle}>Today's Performance</Text>
          <View style={styles.safetyRow}>
            <Text style={styles.safetyLabel}>Safety</Text>
            <Text style={styles.safetyValue}>98%</Text>
          </View>
          <View style={styles.safetyRow}>
            <Text style={styles.safetyLabel}>Students Transported</Text>
            <Text style={styles.safetyValue}>{students}</Text>
          </View>
          <View style={styles.safetyRow}>
            <Text style={styles.safetyLabel}>On Time</Text>
            <Text style={styles.safetyValue}>Yes</Text>
          </View>
          <View style={styles.safetyRow}>
            <Text style={styles.safetyLabel}>Overspeed</Text>
            <Text style={styles.safetyValue}>0</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.homeButton} onPress={() => navigation.navigate('Home')} activeOpacity={0.85}>
          <Text style={styles.homeButtonText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  checkmark: { fontSize: 72, marginBottom: spacing.md },
  title: { fontSize: 32, fontWeight: '800', color: colors.text, marginBottom: spacing.xs },
  subtitle: { fontSize: 16, color: colors.textSecondary, marginBottom: spacing.xl },
  statsGrid: { flexDirection: 'row', marginBottom: spacing.xl, gap: spacing.md },
  statItem: { flex: 1, backgroundColor: colors.surface, borderRadius: 16, padding: spacing.md, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  statValue: { fontSize: 28, fontWeight: '800', color: colors.primary },
  statLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 4, fontWeight: '500' },
  safetyCard: { backgroundColor: colors.surface, borderRadius: 16, padding: spacing.md, width: '100%', marginBottom: spacing.xl, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  safetyTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  safetyRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs, borderBottomWidth: 1, borderBottomColor: colors.border },
  safetyLabel: { fontSize: 14, color: colors.textSecondary },
  safetyValue: { fontSize: 14, fontWeight: '700', color: colors.text },
  homeButton: { backgroundColor: colors.primary, paddingVertical: 16, paddingHorizontal: 48, borderRadius: 14, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  homeButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
