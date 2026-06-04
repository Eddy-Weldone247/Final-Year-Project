import { type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

interface CardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/** Themed, elevated surface used across the dashboard. */
export function Card({ children, style }: CardProps) {
  const { colors, isDark } = useTheme();
  const themed = { backgroundColor: colors.card, shadowOpacity: isDark ? 0.35 : 0.06 };
  return <View style={[styles.card, themed, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    elevation: 2,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
  },
});
