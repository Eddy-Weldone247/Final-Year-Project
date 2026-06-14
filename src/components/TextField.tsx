import { forwardRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { radius, sizing, spacing } from '@/theme/spacing';
import { fontFamily } from '@/theme/typography';

interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string;
}

export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, error, style, onFocus, onBlur, ...props },
  ref,
) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);

  const borderColor = error ? colors.expense : focused ? colors.primary : colors.inputBorder;

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      <TextInput
        ref={ref}
        style={[
          styles.input,
          { backgroundColor: colors.card, borderColor, color: colors.text },
          style,
        ]}
        placeholderTextColor={colors.placeholder}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        {...props}
      />
      {error ? <Text style={[styles.error, { color: colors.expense }]}>{error}</Text> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  label: { fontSize: 14, fontFamily: fontFamily.medium },
  input: {
    borderRadius: radius.md,
    borderWidth: 1,
    fontSize: 16,
    fontFamily: fontFamily.regular,
    height: sizing.control,
    paddingHorizontal: spacing.lg,
  },
  error: { fontSize: 13, fontFamily: fontFamily.medium, marginLeft: spacing.xs },
});
