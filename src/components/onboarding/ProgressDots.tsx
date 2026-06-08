import { StyleSheet, View } from 'react-native';
import Animated, { interpolate, type SharedValue, useAnimatedStyle } from 'react-native-reanimated';

import { useAuthTheme } from '@/theme/authTheme';

function Dot({
  index,
  scrollX,
  width,
}: {
  index: number;
  scrollX: SharedValue<number>;
  width: number;
}) {
  const { c } = useAuthTheme();
  const style = useAnimatedStyle(() => {
    const input = [(index - 1) * width, index * width, (index + 1) * width];
    return {
      width: interpolate(scrollX.value, input, [8, 26, 8], 'clamp'),
      opacity: interpolate(scrollX.value, input, [0.3, 1, 0.3], 'clamp'),
    };
  });
  return <Animated.View style={[styles.dot, { backgroundColor: c.primary }, style]} />;
}

/** Pill-style progress dots; the active one stretches as you swipe. */
export function ProgressDots({
  count,
  scrollX,
  width,
}: {
  count: number;
  scrollX: SharedValue<number>;
  width: number;
}) {
  return (
    <View style={styles.row}>
      {Array.from({ length: count }).map((_, i) => (
        <Dot key={i} index={i} scrollX={scrollX} width={width} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { height: 8, borderRadius: 4 },
});
