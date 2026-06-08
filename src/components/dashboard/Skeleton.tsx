import { useEffect } from 'react';
import {
  StyleSheet,
  View,
  type DimensionValue,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Card } from '@/components/Card';
import { useTheme } from '@/hooks/useTheme';

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

/** A softly pulsing placeholder block. */
export function Skeleton({ width = '100%', height = 16, radius = 8, style }: SkeletonProps) {
  const { colors } = useTheme();
  const p = useSharedValue(0);

  useEffect(() => {
    p.value = withRepeat(
      withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [p]);

  const animated = useAnimatedStyle(() => ({ opacity: 0.4 + p.value * 0.45 }));

  return (
    <Animated.View
      style={[
        { width, height, borderRadius: radius, backgroundColor: colors.cardAlt },
        animated,
        style,
      ]}
    />
  );
}

/** Loading placeholder shaped like a chart card (title + plot area). */
export function ChartCardSkeleton() {
  return (
    <Card>
      <Skeleton width={140} height={16} />
      <View style={styles.body}>
        <Skeleton width={120} height={120} radius={60} />
        <View style={styles.lines}>
          <Skeleton width="100%" height={12} />
          <Skeleton width="80%" height={12} />
          <Skeleton width="90%" height={12} />
          <Skeleton width="60%" height={12} />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  body: { flexDirection: 'row', alignItems: 'center', gap: 20, marginTop: 16 },
  lines: { flex: 1, gap: 10 },
});
