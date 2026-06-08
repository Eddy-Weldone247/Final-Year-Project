import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  Easing,
  withSpring,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

import { useAuthTheme } from '@/theme/authTheme';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const CHECK_LENGTH = 44; // approx length of the check path in the 52px viewBox

/**
 * A glowing circle that springs in, then draws a checkmark stroke. Pure
 * Reanimated + SVG (60 FPS, native thread) — no Lottie asset required. Drop a
 * `LottieView` here later if a branded animation file is preferred.
 */
export function SuccessCheck({ size = 96 }: { size?: number }) {
  const { c } = useAuthTheme();
  const scale = useSharedValue(0);
  const draw = useSharedValue(CHECK_LENGTH);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 11, stiffness: 130 });
    draw.value = withDelay(220, withTiming(0, { duration: 420, easing: Easing.out(Easing.cubic) }));
  }, [draw, scale]);

  const circleStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const pathProps = useAnimatedProps(() => ({ strokeDashoffset: draw.value }));

  return (
    <Animated.View
      style={[
        styles.circle,
        circleStyle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: `${c.success}22`,
          shadowColor: c.success,
        },
      ]}
    >
      <Svg width={size * 0.62} height={size * 0.62} viewBox="0 0 52 52" fill="none">
        <Circle cx="26" cy="26" r="24" stroke={c.success} strokeWidth={2.5} opacity={0.45} />
        <AnimatedPath
          d="M15 27l7.5 7.5L38 19"
          stroke={c.success}
          strokeWidth={4}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={CHECK_LENGTH}
          animatedProps={pathProps}
        />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.5,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
});
