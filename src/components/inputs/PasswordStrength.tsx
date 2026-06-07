import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { CheckIcon } from '@/components/icons';
import { useAuthTheme } from '@/theme/authTheme';
import { fontFamily } from '@/theme/typography';

export interface PasswordCheck {
  key: string;
  label: string;
  met: boolean;
}

export function getPasswordChecks(pw: string): PasswordCheck[] {
  return [
    { key: 'len', label: 'At least 8 characters', met: pw.length >= 8 },
    { key: 'upper', label: 'One uppercase letter', met: /[A-Z]/.test(pw) },
    { key: 'num', label: 'One number', met: /[0-9]/.test(pw) },
    { key: 'sym', label: 'One symbol', met: /[^A-Za-z0-9]/.test(pw) },
  ];
}

const AMBER = '#F59E0B';

function Rule({ label, met }: { label: string; met: boolean }) {
  const { c } = useAuthTheme();
  const p = useSharedValue(met ? 1 : 0);
  useEffect(() => {
    p.value = withTiming(met ? 1 : 0, { duration: 200 });
  }, [met, p]);

  const dotStyle = useAnimatedStyle(() => ({
    backgroundColor: met ? c.success : 'transparent',
    borderColor: met ? c.success : c.textFaint,
    transform: [{ scale: 0.85 + p.value * 0.15 }],
  }));
  const checkStyle = useAnimatedStyle(() => ({
    opacity: p.value,
    transform: [{ scale: p.value }],
  }));

  return (
    <View style={styles.rule}>
      <Animated.View style={[styles.dot, dotStyle]}>
        <Animated.View style={checkStyle}>
          <CheckIcon size={12} color={c.onPrimary} strokeWidth={3} />
        </Animated.View>
      </Animated.View>
      <Text style={[styles.ruleLabel, { color: met ? c.text : c.textMuted }]}>{label}</Text>
    </View>
  );
}

/** Live password strength bar + animated requirement checklist. */
export function PasswordStrength({ password }: { password: string }) {
  const { c } = useAuthTheme();
  const checks = getPasswordChecks(password);
  const score = checks.filter((ch) => ch.met).length;

  const meta =
    score <= 1
      ? { label: 'Weak', color: c.danger }
      : score === 2
        ? { label: 'Fair', color: AMBER }
        : score === 3
          ? { label: 'Good', color: c.secondary }
          : { label: 'Strong', color: c.success };

  const fill = useSharedValue(0);
  useEffect(() => {
    fill.value = withTiming(score / 4, { duration: 260 });
  }, [score, fill]);
  const fillStyle = useAnimatedStyle(() => ({
    width: `${fill.value * 100}%`,
    backgroundColor: meta.color,
  }));

  if (password.length === 0) return null;

  return (
    <Animated.View entering={FadeIn.duration(220)} style={styles.wrap}>
      <View style={styles.barRow}>
        <View style={[styles.track, { backgroundColor: c.inputBorder }]}>
          <Animated.View style={[styles.fill, fillStyle]} />
        </View>
        <Text style={[styles.strength, { color: meta.color }]}>{meta.label}</Text>
      </View>
      <View style={styles.checks}>
        {checks.map((ch) => (
          <Rule key={ch.key} label={ch.label} met={ch.met} />
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12, marginTop: 2 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  track: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
  strength: { width: 52, fontSize: 12, fontFamily: fontFamily.semibold, textAlign: 'right' },
  checks: { gap: 8 },
  rule: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ruleLabel: { fontSize: 13, fontFamily: fontFamily.medium },
});
