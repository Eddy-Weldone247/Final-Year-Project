import { BlurView } from 'expo-blur';
import { useEffect, useState } from 'react';
import { type LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { PressableScale } from '@/components/animations/PressableScale';
import { useAuthTheme } from '@/theme/authTheme';
import { fontFamily } from '@/theme/typography';
import type { TransactionType } from '@/types/transaction';

// Smooth, lightly snappy glide with almost no overshoot.
const SPRING = { mass: 0.8, damping: 20, stiffness: 220 } as const;

// Track padding + border. Used for both the geometry math and the styles so the
// sliding pill exactly matches one segment (no overflow past the track edge).
const PADDING = 4;
const BORDER = 1;

/** `#RRGGBB` → `rgba(r,g,b,a)` so interpolateColor gets a consistent format. */
function rgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

interface TypeToggleProps {
  type: TransactionType;
  onChange: (t: TransactionType) => void;
}

/**
 * Frosted-glass expense/income segmented control. A single shared value (0 =
 * expense, 1 = income) springs on change and drives everything at once — the
 * pill's position, its fill/border/glow colour, and both labels' colours — so
 * the whole control morphs in one continuous, 60 FPS motion (no colour snapping).
 */
export function TypeToggle({ type, onChange }: TypeToggleProps) {
  const { c } = useAuthTheme();
  const [trackW, setTrackW] = useState(0);
  const index = type === 'INCOME' ? 1 : 0;

  const pos = useSharedValue(index);
  useEffect(() => {
    pos.value = withSpring(index, SPRING);
  }, [index, pos]);

  // Track is border-box: layout width includes border + padding, so subtract
  // both to get the true inner content width that the two segments share.
  const segW = trackW > 0 ? (trackW - PADDING * 2 - BORDER * 2) / 2 : 0;

  // Colour endpoints: expense → primary (blue), income → success (green).
  const expenseFill = rgba(c.primary, 0.16);
  const incomeFill = rgba(c.success, 0.16);
  const expenseBorder = rgba(c.primary, 0.5);
  const incomeBorder = rgba(c.success, 0.5);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pos.value * segW }],
    backgroundColor: interpolateColor(pos.value, [0, 1], [expenseFill, incomeFill]),
    borderColor: interpolateColor(pos.value, [0, 1], [expenseBorder, incomeBorder]),
    shadowColor: interpolateColor(pos.value, [0, 1], [c.primary, c.success]),
  }));

  const expenseTextStyle = useAnimatedStyle(() => ({
    color: interpolateColor(pos.value, [0, 1], [c.primary, c.textMuted]),
  }));
  const incomeTextStyle = useAnimatedStyle(() => ({
    color: interpolateColor(pos.value, [0, 1], [c.textMuted, c.success]),
  }));

  const onLayout = (e: LayoutChangeEvent) => setTrackW(e.nativeEvent.layout.width);

  return (
    <BlurView
      intensity={c.blurIntensity}
      tint={c.blurTint}
      experimentalBlurMethod="dimezisBlurView"
      style={styles.clip}
    >
      <View
        style={[styles.track, { backgroundColor: c.glassBg, borderColor: c.glassBorder }]}
        onLayout={onLayout}
      >
        {segW > 0 ? (
          <Animated.View
            pointerEvents="none"
            style={[styles.indicator, { width: segW }, indicatorStyle]}
          />
        ) : null}

        {/* flex:1 lives on the wrapping View — PressableScale forwards `style` to
            its inner Animated.View, not the Pressable, so flex must wrap it. */}
        <View style={styles.segWrap}>
          <PressableScale
            onPress={() => onChange('EXPENSE')}
            scaleTo={0.97}
            style={styles.seg}
            accessibilityLabel="Expense"
          >
            <Animated.Text style={[styles.segText, expenseTextStyle]}>Expense</Animated.Text>
          </PressableScale>
        </View>

        <View style={styles.segWrap}>
          <PressableScale
            onPress={() => onChange('INCOME')}
            scaleTo={0.97}
            style={styles.seg}
            accessibilityLabel="Income"
          >
            <Animated.Text style={[styles.segText, incomeTextStyle]}>Income</Animated.Text>
          </PressableScale>
        </View>
      </View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  clip: { borderRadius: 16, overflow: 'hidden' },
  track: { flexDirection: 'row', borderRadius: 16, borderWidth: BORDER, padding: PADDING },
  indicator: {
    position: 'absolute',
    top: PADDING,
    bottom: PADDING,
    left: PADDING,
    borderRadius: 12,
    borderWidth: 1,
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  segWrap: { flex: 1 },
  seg: { alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 12 },
  segText: { fontSize: 15, fontFamily: fontFamily.semibold },
});
