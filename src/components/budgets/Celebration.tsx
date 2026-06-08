import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#06B6D4', '#F59E0B'];
const COUNT = 14;

const PARTICLES = Array.from({ length: COUNT }).map((_, i) => {
  const angle = (i / COUNT) * Math.PI * 2;
  return {
    angle,
    distance: 80 + (i % 3) * 26,
    color: COLORS[i % COLORS.length] as string,
    size: 7 + (i % 3) * 3,
  };
});

function Particle({
  angle,
  distance,
  color,
  size,
  t,
}: {
  angle: number;
  distance: number;
  color: string;
  size: number;
  t: SharedValue<number>;
}) {
  const style = useAnimatedStyle(() => {
    const d = t.value;
    return {
      opacity: interpolate(d, [0, 0.1, 0.85, 1], [0, 1, 1, 0]),
      transform: [
        { translateX: Math.cos(angle) * distance * d },
        { translateY: Math.sin(angle) * distance * d },
        { scale: interpolate(d, [0, 0.3, 1], [0.2, 1, 0.5]) },
      ],
    };
  });
  return (
    <Animated.View
      style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }, style]}
    />
  );
}

/** A one-shot particle burst — plays when `play` transitions to true. */
export function Celebration({ play }: { play: boolean }) {
  const t = useSharedValue(0);

  useEffect(() => {
    if (play) {
      t.value = 0;
      t.value = withTiming(1, { duration: 1100, easing: Easing.out(Easing.quad) });
    }
  }, [play, t]);

  if (!play) return null;

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.center]}>
      {PARTICLES.map((p, i) => (
        <Particle key={i} {...p} t={t} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
});
