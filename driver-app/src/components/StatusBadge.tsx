import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StatusBadgeProps {
  status: string;
  label?: string;
}

const statusColors: Record<string, string> = {
  active: '#10B981',
  scheduled: '#3B82F6',
  completed: '#64748B',
  cancelled: '#EF4444',
  present: '#10B981',
  absent: '#EF4444',
  late: '#F59E0B',
  low: '#10B981',
  medium: '#F59E0B',
  high: '#EF4444',
  critical: '#7C3AED',
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label }) => {
  const color = statusColors[status.toLowerCase()] || '#64748B';
  const displayLabel = label || status;

  return (
    <View style={[styles.badge, { backgroundColor: color + '20', borderColor: color }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.text, { color }]}>{displayLabel}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});

export default StatusBadge;
