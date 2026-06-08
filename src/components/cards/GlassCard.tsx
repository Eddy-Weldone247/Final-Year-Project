import { BlurView } from 'expo-blur';
import { type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useAuthTheme } from '@/theme/authTheme';

interface GlassCardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Entrance delay (ms) for staggering multiple cards. */
  delay?: number;
  /** Disable inner padding (e.g. for custom layouts). */
  bare?: boolean;
}

/** Frosted-glass surface: backdrop blur + translucent fill + glowing border. */
export function GlassCard({ children, style, delay = 0, bare = false }: GlassCardProps) {
  const { c } = useAuthTheme();

  return (
    <Animated.View
      entering={FadeInDown.duration(620).delay(delay).springify().damping(16)}
      style={[styles.shadow, { shadowColor: c.glow }, style]}
    >
      <BlurView
        intensity={c.blurIntensity}
        tint={c.blurTint}
        experimentalBlurMethod="dimezisBlurView"
        style={styles.clip}
      >
        <View
          style={[
            styles.surface,
            !bare && styles.padded,
            { backgroundColor: c.glassBg, borderColor: c.glassBorder },
          ]}
        >
          <View
            pointerEvents="none"
            style={[styles.highlight, { backgroundColor: c.glassHighlight }]}
          />
          {children}
        </View>
      </BlurView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    borderRadius: 28,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.35,
    shadowRadius: 30,
    elevation: 14,
  },
  clip: { borderRadius: 28, overflow: 'hidden' },
  surface: { borderRadius: 28, borderWidth: 1 },
  padded: { padding: 24 },
  highlight: {
    position: 'absolute',
    top: 0,
    left: 32,
    right: 32,
    height: 1,
    opacity: 0.7,
    borderRadius: 1,
  },
});
