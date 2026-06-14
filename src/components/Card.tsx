import { type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { radius, shadow, spacing } from '@/theme/spacing';

interface CardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/** Themed, elevated surface used across the dashboard. */
export function Card({ children, style }: CardProps) {
  const { colors, isDark } = useTheme();
  // Shadows read as near-black; lift opacity a touch in dark mode, and add a
  // hairline border so the card edge stays crisp on busy backgrounds.
  const themed = {
    backgroundColor: colors.card,
    borderColor: colors.border,
    shadowOpacity: isDark ? 0.4 : 0.08,
  };
  return <View style={[styles.card, themed, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
    ...shadow.md,
  },
});
