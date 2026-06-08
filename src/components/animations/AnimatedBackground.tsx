import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import { useAuthTheme } from '@/theme/authTheme';

interface BlobConfig {
  id: string;
  color: string;
  size: number;
  x: number;
  y: number;
  driftX: number;
  driftY: number;
  duration: number;
  delay: number;
}

/** A single soft radial-glow blob that gently floats (native-thread transform). */
function Blob({ config }: { config: BlobConfig }) {
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withDelay(
      config.delay,
      withRepeat(
        withTiming(1, { duration: config.duration, easing: Easing.inOut(Easing.sin) }),
        -1,
        true,
      ),
    );
  }, [config.delay, config.duration, t]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(t.value, [0, 1], [0, config.driftX]) },
      { translateY: interpolate(t.value, [0, 1], [0, config.driftY]) },
      { scale: interpolate(t.value, [0, 1], [1, 1.14]) },
    ],
    opacity: interpolate(t.value, [0, 1], [0.5, 0.85]),
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', left: config.x, top: config.y }, style]}
    >
      <Svg width={config.size} height={config.size}>
        <Defs>
          <RadialGradient id={config.id} cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={config.color} stopOpacity={0.9} />
            <Stop offset="55%" stopColor={config.color} stopOpacity={0.35} />
            <Stop offset="100%" stopColor={config.color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle
          cx={config.size / 2}
          cy={config.size / 2}
          r={config.size / 2}
          fill={`url(#${config.id})`}
        />
      </Svg>
    </Animated.View>
  );
}

/** A small slowly-rotating translucent geometric ring (a "glass particle"). */
function Ring({
  size,
  x,
  y,
  color,
  duration,
}: {
  size: number;
  x: number;
  y: number;
  color: string;
  duration: number;
}) {
  const r = useSharedValue(0);
  useEffect(() => {
    r.value = withRepeat(withTiming(1, { duration, easing: Easing.linear }), -1, false);
  }, [duration, r]);
  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(r.value, [0, 1], [0, 360])}deg` }],
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        { position: 'absolute', left: x, top: y, width: size, height: size, borderRadius: 8 },
        style,
      ]}
    >
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 3,
          borderWidth: 1.5,
          borderColor: color,
          opacity: 0.18,
          transform: [{ rotate: '15deg' }],
        }}
      />
    </Animated.View>
  );
}

/**
 * Full-screen animated gradient backdrop with floating glow blobs and drifting
 * glass particles. Lightweight: only transform/opacity are animated, all on the
 * native (UI) thread via Reanimated.
 */
export function AnimatedBackground() {
  const { c } = useAuthTheme();
  const { width, height } = useWindowDimensions();

  const blobs: BlobConfig[] = [
    {
      id: 'blobA',
      color: c.blobs[0],
      size: width * 0.95,
      x: -width * 0.3,
      y: -height * 0.08,
      driftX: 24,
      driftY: 30,
      duration: 9000,
      delay: 0,
    },
    {
      id: 'blobB',
      color: c.blobs[1],
      size: width * 0.85,
      x: width * 0.45,
      y: height * 0.12,
      driftX: -28,
      driftY: 22,
      duration: 11000,
      delay: 600,
    },
    {
      id: 'blobC',
      color: c.blobs[2],
      size: width * 0.7,
      x: width * 0.1,
      y: height * 0.62,
      driftX: 30,
      driftY: -26,
      duration: 12000,
      delay: 1200,
    },
  ];

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={c.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {blobs.map((b) => (
        <Blob key={b.id} config={b} />
      ))}
      <Ring size={90} x={width * 0.72} y={height * 0.08} color={c.accent} duration={26000} />
      <Ring size={56} x={width * 0.12} y={height * 0.5} color={c.secondary} duration={32000} />
    </View>
  );
}
