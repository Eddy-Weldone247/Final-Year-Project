import { LinearGradient } from 'expo-linear-gradient';
import { type ReactNode, useEffect } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useAuthTheme } from '@/theme/authTheme';
import { fontFamily } from '@/theme/typography';

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  /** Trailing icon (e.g. arrow). */
  icon?: ReactNode;
}

/**
 * Primary CTA: gradient fill, soft elevation, a press-scale micro-interaction
 * and a gentle continuous glow pulse. 60 FPS (transform/opacity on UI thread).
 */
export function GradientButton({ title, onPress, loading, disabled, icon }: GradientButtonProps) {
  const { c } = useAuthTheme();
  const isDisabled = disabled || loading;

  const press = useSharedValue(0);
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [pulse]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - press.value * 0.04 }],
    shadowOpacity: isDisabled ? 0 : 0.35 + pulse.value * 0.25,
    shadowRadius: 16 + pulse.value * 10,
  }));

  return (
    <Animated.View style={[styles.shadow, { shadowColor: c.glow }, containerStyle]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
        disabled={isDisabled}
        onPress={onPress}
        onPressIn={() => (press.value = withSpring(1, { damping: 18, stiffness: 320 }))}
        onPressOut={() => (press.value = withSpring(0, { damping: 18, stiffness: 320 }))}
        style={styles.press}
      >
        <LinearGradient
          colors={c.primaryGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradient, isDisabled && styles.disabled]}
        >
          {loading ? (
            <ActivityIndicator color={c.onPrimary} />
          ) : (
            <View style={styles.row}>
              <Text style={[styles.label, { color: c.onPrimary }]}>{title}</Text>
              {icon ? <View style={styles.icon}>{icon}</View> : null}
            </View>
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    borderRadius: 16,
    shadowOffset: { width: 0, height: 10 },
  },
  press: { borderRadius: 16, overflow: 'hidden' },
  gradient: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  disabled: { opacity: 0.55 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  label: { fontSize: 16, fontFamily: fontFamily.semibold, letterSpacing: 0.2 },
  icon: { marginTop: 1 },
});
