import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors, spacing, typography } from '../theme';

interface TripProgressBarProps {
  visited: number;
  total: number;
}

const TripProgressBar: React.FC<TripProgressBarProps> = ({ visited, total }) => {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const percentage = total > 0 ? visited / total : 0;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: percentage,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [percentage, progressAnim]);

  const widthInterpolated = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>Trip Progress</Text>
        <Text style={styles.count}>
          {visited} / {total}
        </Text>
      </View>
      <View style={styles.track}>
        <Animated.View
          style={[
            styles.fill,
            {
              width: widthInterpolated,
              backgroundColor:
                percentage >= 1 ? colors.success : percentage > 0.5 ? colors.primary : colors.warning,
            },
          ]}
        />
      </View>
      <View style={styles.stops}>
        {Array.from({ length: total }, (_, i) => (
          <View
            key={i}
            style={[
              styles.stopDot,
              { backgroundColor: i < visited ? colors.primary : colors.border },
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  label: {
    ...typography.caption,
    fontWeight: '600',
  },
  count: {
    ...typography.body,
    fontWeight: '700',
    color: colors.primary,
  },
  track: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
  stops: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stopDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default TripProgressBar;
