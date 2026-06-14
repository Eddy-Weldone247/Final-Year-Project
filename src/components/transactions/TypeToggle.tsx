import { BlurView } from 'expo-blur';
import { useEffect, useState } from 'react';
import { type LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { PressableScale } from '@/components/animations/PressableScale';
import { useAuthTheme } from '@/theme/authTheme';
import { fontFamily } from '@/theme/typography';
import type { TransactionType } from '@/types/transaction';

const OPTIONS: { key: TransactionType; label: string }[] = [
  { key: 'EXPENSE', label: 'Expense' },
  { key: 'INCOME', label: 'Income' },
];

interface TypeToggleProps {
  type: TransactionType;
  onChange: (t: TransactionType) => void;
  /** Active color (expense → primary, income → success). */
  accent: string;
}

/**
 * Frosted-glass expense/income segmented control with a spring-animated, glowing
 * selection indicator that slides between segments (UI-thread, 60 FPS).
 */
export function TypeToggle({ type, onChange, accent }: TypeToggleProps) {
  const { c } = useAuthTheme();
  const [trackW, setTrackW] = useState(0);
  const index = type === 'INCOME' ? 1 : 0;

  const pos = useSharedValue(index);
  useEffect(() => {
    pos.value = withSpring(index, { damping: 18, stiffness: 220 });
  }, [index, pos]);

  const segW = trackW > 0 ? (trackW - 8) / 2 : 0;
  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pos.value * segW }],
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
            style={[
              styles.indicator,
              {
                width: segW,
                backgroundColor: `${accent}26`,
                borderColor: `${accent}66`,
                shadowColor: accent,
              },
              indicatorStyle,
            ]}
          />
        ) : null}
        {OPTIONS.map((o) => {
          const active = type === o.key;
          return (
            <PressableScale
              key={o.key}
              onPress={() => onChange(o.key)}
              scaleTo={0.97}
              style={styles.segWrap}
              accessibilityLabel={o.label}
            >
              <View style={styles.seg}>
                <Text style={[styles.segText, { color: active ? accent : c.textMuted }]}>
                  {o.label}
                </Text>
              </View>
            </PressableScale>
          );
        })}
      </View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  clip: { borderRadius: 16, overflow: 'hidden' },
  track: { flexDirection: 'row', borderRadius: 16, borderWidth: 1, padding: 4 },
  indicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    borderRadius: 12,
    borderWidth: 1,
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  segWrap: { flex: 1 },
  seg: { alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 12 },
  segText: { fontSize: 15, fontFamily: fontFamily.semibold },
});
