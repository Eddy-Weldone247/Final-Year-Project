import { useEffect } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useAuthTheme } from '@/theme/authTheme';
import { fontFamily } from '@/theme/typography';

interface AmountFieldProps {
  value: string;
  onChangeText: (v: string) => void;
  /** Accent colour for the currency symbol + caret (reflects expense/income). */
  accent: string;
  /** Increment this to trigger a shake (e.g. on invalid submit). */
  shakeSignal: number;
}

/** Hero amount input — big, centred, with a focus glow and shake-on-error. */
export function AmountField({ value, onChangeText, accent, shakeSignal }: AmountFieldProps) {
  const { c } = useAuthTheme();
  const tx = useSharedValue(0);
  const focus = useSharedValue(0);

  useEffect(() => {
    if (shakeSignal > 0) {
      tx.value = withSequence(
        withTiming(-10, { duration: 55 }),
        withTiming(10, { duration: 55 }),
        withTiming(-6, { duration: 55 }),
        withTiming(0, { duration: 55 }),
      );
    }
  }, [shakeSignal, tx]);

  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: tx.value }] }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: focus.value }));

  return (
    <Animated.View style={[styles.wrap, shakeStyle]}>
      <Animated.View
        pointerEvents="none"
        style={[styles.glow, { shadowColor: accent, backgroundColor: `${accent}14` }, glowStyle]}
      />
      <View style={styles.row}>
        <Text style={[styles.currency, { color: accent }]}>$</Text>
        <TextInput
          value={value}
          onChangeText={(t) => onChangeText(t.replace(/[^0-9.]/g, ''))}
          keyboardType="decimal-pad"
          placeholder="0"
          placeholderTextColor={c.textFaint}
          selectionColor={accent}
          style={[styles.input, { color: c.text }]}
          onFocus={() => (focus.value = withSpring(1))}
          onBlur={() => (focus.value = withTiming(0, { duration: 200 }))}
          accessibilityLabel="Amount"
          maxLength={12}
        />
      </View>
      <Text style={[styles.hint, { color: c.textFaint }]}>Enter amount</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: 8 },
  glow: {
    position: 'absolute',
    top: 0,
    width: 220,
    height: 80,
    borderRadius: 40,
    shadowOpacity: 0.6,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 0 },
  },
  row: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center' },
  currency: { fontSize: 28, fontFamily: fontFamily.bold, marginTop: 8, marginRight: 2 },
  input: {
    fontSize: 56,
    fontFamily: fontFamily.extrabold,
    letterSpacing: -1,
    minWidth: 80,
    textAlign: 'center',
    padding: 0,
  },
  hint: { fontSize: 13, fontFamily: fontFamily.medium, marginTop: 2 },
});
