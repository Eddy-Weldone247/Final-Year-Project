import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { radius, shadow, sizing } from '@/theme/spacing';
import { fontFamily } from '@/theme/typography';

type Variant = 'primary' | 'ghost' | 'danger';

interface ButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: Variant;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  style,
}: ButtonProps) {
  const { colors } = useTheme();
  const isDisabled = disabled || loading;
  const isGhost = variant === 'ghost';

  const backgroundColor =
    variant === 'ghost' ? 'transparent' : variant === 'danger' ? colors.expense : colors.primary;
  const labelColor = isGhost ? colors.primary : colors.onPrimary;
  const spinnerColor = isGhost ? colors.primary : colors.onPrimary;

  // Filled buttons get a soft shadow tinted to their own color; ghost stays flat.
  const elevation = isGhost || isDisabled ? null : { ...shadow.md, shadowColor: backgroundColor };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor },
        elevation,
        isDisabled ? styles.disabled : null,
        pressed && !isDisabled ? styles.pressed : null,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={spinnerColor} />
      ) : (
        <Text style={[styles.label, { color: labelColor }]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderRadius: radius.md,
    height: sizing.control,
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.96, transform: [{ scale: 0.98 }] },
  label: { fontSize: 16, fontFamily: fontFamily.semibold, letterSpacing: 0.2 },
});
