import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Student } from '../types';
import { colors, spacing } from '../theme';

interface StudentCardProps {
  student: Student;
  scanStatus?: 'BOARD_IN' | 'EXIT_OUT' | null;
}

const scanColors: Record<string, string> = {
  BOARD_IN: '#10B981',
  EXIT_OUT: '#3B82F6',
};

const scanLabels: Record<string, string> = {
  BOARD_IN: 'Boarded',
  EXIT_OUT: 'Exited',
};

const StudentCard: React.FC<StudentCardProps> = ({ student, scanStatus }) => {
  return (
    <View style={styles.card}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {student.firstName[0]}
          {student.lastName[0]}
        </Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>
          {student.firstName} {student.lastName}
        </Text>
        <Text style={styles.detail}>
          Grade {student.grade}
          {student.section ? ` • ${student.section}` : ''}
        </Text>
      </View>
      {scanStatus ? (
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: (scanColors[scanStatus] || '#94A3B8') + '20' },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              { backgroundColor: scanColors[scanStatus] || '#94A3B8' },
            ]}
          />
          <Text
            style={[
              styles.statusText,
              { color: scanColors[scanStatus] || '#94A3B8' },
            ]}
          >
            {scanLabels[scanStatus] || 'Pending'}
          </Text>
        </View>
      ) : (
        <View style={[styles.statusBadge, { backgroundColor: '#94A3B8' + '20' }]}>
          <View style={[styles.statusDot, { backgroundColor: '#94A3B8' }]} />
          <Text style={[styles.statusText, { color: '#94A3B8' }]}>Pending</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: spacing.sm,
    marginHorizontal: spacing.md,
    marginVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  detail: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default StudentCard;
