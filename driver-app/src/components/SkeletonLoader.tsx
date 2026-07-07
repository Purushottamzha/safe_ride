import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';
import { colors } from '../theme';

const { width } = Dimensions.get('window');

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export default function SkeletonLoader({ width: w = '100%', height = 20, borderRadius = 6, style }: SkeletonLoaderProps) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(Animated.sequence([
      Animated.timing(shimmerAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      Animated.timing(shimmerAnim, { toValue: 0, duration: 1200, useNativeDriver: true }),
    ]));
    anim.start();
    return () => anim.stop();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.5, 0.3],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width: w as any,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function SkeletonCard() {
  return (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <SkeletonLoader width={40} height={40} borderRadius={20} />
        <View style={styles.cardCol}>
          <SkeletonLoader width={width * 0.5} height={16} />
          <SkeletonLoader width={width * 0.3} height={12} style={{ marginTop: 6 }} />
        </View>
      </View>
    </View>
  );
}

export function SkeletonTripRow() {
  return (
    <View style={styles.tripRow}>
      <SkeletonLoader width={8} height={8} borderRadius={4} />
      <SkeletonLoader width={80} height={14} style={{ marginHorizontal: 12 }} />
      <SkeletonLoader width={60} height={14} />
      <SkeletonLoader width={100} height={14} style={{ marginLeft: 'auto' }} />
    </View>
  );
}

export function SkeletonHeroCard() {
  return (
    <View style={styles.heroCard}>
      <SkeletonLoader width={120} height={14} />
      <SkeletonLoader width={180} height={40} style={{ marginTop: 12 }} />
      <SkeletonLoader width={140} height={14} style={{ marginTop: 8 }} />
      <SkeletonLoader width={80} height={12} style={{ marginTop: 6 }} />
      <SkeletonLoader width="100%" height={48} style={{ marginTop: 16, borderRadius: 12 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: { backgroundColor: colors.border },
  card: {
    backgroundColor: colors.surface, borderRadius: 12, padding: 12,
    marginHorizontal: 16, marginBottom: 8,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  cardCol: { flex: 1, marginLeft: 12 },
  tripRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  heroCard: {
    marginHorizontal: 16, marginBottom: 24,
    backgroundColor: colors.primary, borderRadius: 20, padding: 24,
  },
});
