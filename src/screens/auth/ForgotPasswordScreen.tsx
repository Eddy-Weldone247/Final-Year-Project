import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { FadeInView } from '@/components/FadeInView';
import { ScreenContainer } from '@/components/ScreenContainer';
import { TextField } from '@/components/TextField';
import { useForgotPassword } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import type { AuthStackParamList } from '@/navigation/types';
import { getErrorMessage } from '@/utils/getErrorMessage';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export function ForgotPasswordScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const forgotPassword = useForgotPassword();

  const canSubmit = email.trim().length > 0;

  const handleSubmit = () => {
    forgotPassword.mutate(
      { email: email.trim() },
      {
        onSuccess: (data) =>
          Alert.alert('Check your email', data.message, [
            { text: 'Enter reset code', onPress: () => navigation.navigate('ResetPassword', {}) },
            { text: 'Done', style: 'cancel' },
          ]),
        onError: (error) => Alert.alert('Request failed', getErrorMessage(error)),
      },
    );
  };

  return (
    <ScreenContainer>
      <FadeInView style={styles.form}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Forgot password</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Enter your email and we&apos;ll send you a code to reset your password.
          </Text>
        </View>

        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
        />

        <Button
          title="Send reset code"
          onPress={handleSubmit}
          loading={forgotPassword.isPending}
          disabled={!canSubmit}
        />
        <Button
          title="I already have a code"
          variant="ghost"
          onPress={() => navigation.navigate('ResetPassword', {})}
        />
        <Button
          title="Back to sign in"
          variant="ghost"
          onPress={() => navigation.navigate('Login')}
        />
      </FadeInView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  form: { gap: 16 },
  header: { gap: 6, marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '700' },
  subtitle: { fontSize: 15 },
});
