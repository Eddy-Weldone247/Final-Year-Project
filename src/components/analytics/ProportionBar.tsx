import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import type { AuthPalette } from '@/theme/authTheme';

/** Animated income-vs-expense split bar (income green, expense red). */
export function ProportionBar({ incomePct, c }: { incomePct: number; c: AuthPalette }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(150, withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) }));
  }, [incomePct, p]);

  const incomeStyle = useAnimatedStyle(() => ({ width: `${incomePct * 100 * p.value}%` }));
  const expenseStyle = useAnimatedStyle(() => ({ width: `${(1 - incomePct) * 100 * p.value}%` }));

  return (
    <View style={[styles.track, { backgroundColor: c.inputBg }]}>
      <Animated.View style={[styles.seg, { backgroundColor: c.success }, incomeStyle]} />
      <Animated.View style={[styles.seg, { backgroundColor: c.danger }, expenseStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', height: 12, borderRadius: 6, overflow: 'hidden' },
  seg: { height: '100%' },
});
