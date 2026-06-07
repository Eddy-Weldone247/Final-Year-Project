import { type ReactNode } from 'react';
import { Pressable, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

interface PressableScaleProps {
  children: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  hitSlop?: number;
  accessibilityLabel?: string;
}

/** Pressable with a springy scale-down micro-interaction (UI-thread, 60 FPS). */
export function PressableScale({
  children,
  onPress,
  disabled,
  style,
  scaleTo = 0.96,
  hitSlop,
  accessibilityLabel,
}: PressableScaleProps) {
  const s = useSharedValue(0);
  const animated = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - s.value * (1 - scaleTo) }],
  }));

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      hitSlop={hitSlop}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPressIn={() => (s.value = withSpring(1, { damping: 18, stiffness: 320 }))}
      onPressOut={() => (s.value = withSpring(0, { damping: 18, stiffness: 320 }))}
    >
      <Animated.View style={[style, animated, disabled ? { opacity: 0.5 } : null]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
