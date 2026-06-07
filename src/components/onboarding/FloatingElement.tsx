import { type ReactNode, useEffect } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

interface FloatingElementProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Vertical travel in px. */
  amplitude?: number;
  /** Full cycle duration (ms). */
  duration?: number;
  delay?: number;
  /** Max rotation in degrees (gentle sway). */
  rotate?: number;
}

/** Wraps children in a soft, looping up/down float + sway (UI-thread, 60 FPS). */
export function FloatingElement({
  children,
  style,
  amplitude = 10,
  duration = 2800,
  delay = 0,
  rotate = 0,
}: FloatingElementProps) {
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }), -1, true),
    );
  }, [delay, duration, t]);

  const animated = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(t.value, [0, 1], [-amplitude, amplitude]) },
      { rotate: `${interpolate(t.value, [0, 1], [-rotate, rotate])}deg` },
    ],
  }));

  return <Animated.View style={[style, animated]}>{children}</Animated.View>;
}
