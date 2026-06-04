import { forwardRef } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string;
}

export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, error, style, ...props },
  ref,
) {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      <TextInput
        ref={ref}
        style={[
          styles.input,
          {
            backgroundColor: colors.card,
            borderColor: error ? colors.expense : colors.inputBorder,
            color: colors.text,
          },
          style,
        ]}
        placeholderTextColor={colors.placeholder}
        {...props}
      />
      {error ? <Text style={[styles.error, { color: colors.expense }]}>{error}</Text> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: { gap: 6 },
  label: { fontSize: 14, fontWeight: '500' },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 16,
    height: 50,
    paddingHorizontal: 14,
  },
  error: { fontSize: 13 },
});
