import { type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/useTheme';
import { spacing } from '@/theme/spacing';

interface ScreenContainerProps {
  children: ReactNode;
  /** When false, content is top-aligned instead of vertically centered. */
  center?: boolean;
}

/** Keyboard-aware, scrollable, safe-area screen wrapper. */
export function ScreenContainer({ children, center = true }: ScreenContainerProps) {
  const { colors } = useTheme();
  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
      edges={['top', 'bottom']}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.content, center ? styles.centered : null]}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  content: { flexGrow: 1, gap: spacing.lg, padding: spacing.xxl },
  centered: { justifyContent: 'center' },
});
