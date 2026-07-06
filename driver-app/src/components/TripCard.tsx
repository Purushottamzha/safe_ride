import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Trip } from '../types';
import { colors, spacing, typography } from '../theme';
import StatusBadge from './StatusBadge';

interface TripCardProps {
  trip: Trip;
  onPress: (trip: Trip) => void;
}

const TripCard: React.FC<TripCardProps> = ({ trip, onPress }) => {
  const formattedTime = new Date(trip.scheduledAt).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const tripType = trip.type === 'MORNING' ? 'Morning' : 'Afternoon';

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(trip)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.typeContainer}>
          <View
            style={[
              styles.typeIndicator,
              {
                backgroundColor:
                  trip.type === 'MORNING' ? '#F59E0B' : '#3B82F6',
              },
            ]}
          />
          <Text style={styles.typeText}>{tripType}</Text>
        </View>
        <StatusBadge status={trip.status} />
      </View>
      <View style={styles.body}>
        <View style={styles.row}>
          <Text style={styles.label}>Scheduled</Text>
          <Text style={styles.value}>{formattedTime}</Text>
        </View>
        {trip.bus && (
          <View style={styles.row}>
            <Text style={styles.label}>Bus</Text>
            <Text style={styles.value}>
              {trip.bus.busNumber} ({trip.bus.plateNumber})
            </Text>
          </View>
        )}
      </View>
      {trip._count && (
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {trip._count.attendance} students | {trip._count.tripEvents} scans
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  typeText: {
    ...typography.h3,
    fontSize: 16,
  },
  body: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  label: {
    ...typography.caption,
  },
  value: {
    ...typography.body,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
  },
  footerText: {
    ...typography.caption,
    textAlign: 'center',
  },
});

export default TripCard;
