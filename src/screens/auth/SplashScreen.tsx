import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { AnimatedBackground } from '@/components/animations/AnimatedBackground';
import { LogoMark } from '@/components/icons';
import { useAuthTheme } from '@/theme/authTheme';
import { fontFamily } from '@/theme/typography';

/**
 * Branded launch screen shown while the session hydrates. Logo springs in,
 * wordmark fades up, and a shimmer bar conveys progress.
 */
export function SplashScreen() {
  const { c } = useAuthTheme();

  const logo = useSharedValue(0);
  const shimmer = useSharedValue(0);

  useEffect(() => {
    logo.value = withSpring(1, { damping: 12, stiffness: 120 });
    shimmer.value = withDelay(
      300,
      withRepeat(withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.ease) }), -1, false),
    );
  }, [logo, shimmer]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logo.value,
    transform: [{ scale: 0.7 + logo.value * 0.3 }, { translateY: (1 - logo.value) * 12 }],
  }));
  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -80 + shimmer.value * 160 }],
    opacity: 0.2 + (1 - Math.abs(shimmer.value - 0.5) * 2) * 0.8,
  }));

  return (
    <View style={[styles.root, { backgroundColor: c.gradient[0] }]}>
      <AnimatedBackground />
      <View style={styles.center}>
        <Animated.View style={[styles.logo, { shadowColor: c.glow }, logoStyle]}>
          <LogoMark size={96} />
        </Animated.View>
        <Animated.Text
          entering={FadeInDown.duration(600).delay(250)}
          style={[styles.name, { color: c.text }]}
        >
          ExpenSee
        </Animated.Text>
        <Animated.Text
          entering={FadeInDown.duration(600).delay(380)}
          style={[styles.tag, { color: c.textMuted }]}
        >
          Smarter money, beautifully tracked
        </Animated.Text>
      </View>

      <View style={styles.progressWrap}>
        <View style={[styles.track, { backgroundColor: c.inputBorder }]}>
          <Animated.View style={[styles.shimmer, { backgroundColor: c.primary }, shimmerStyle]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  center: { alignItems: 'center', gap: 14 },
  logo: {
    borderRadius: 30,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.6,
    shadowRadius: 28,
    elevation: 16,
  },
  name: { fontSize: 32, fontFamily: fontFamily.extrabold, letterSpacing: -0.4, marginTop: 6 },
  tag: { fontSize: 15, fontFamily: fontFamily.regular },
  progressWrap: { position: 'absolute', bottom: 64, width: 160 },
  track: { height: 4, borderRadius: 2, overflow: 'hidden' },
  shimmer: { width: 80, height: '100%', borderRadius: 2 },
});
