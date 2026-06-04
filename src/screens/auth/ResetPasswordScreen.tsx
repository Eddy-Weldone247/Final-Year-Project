import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { FadeInView } from '@/components/FadeInView';
import { ScreenContainer } from '@/components/ScreenContainer';
import { TextField } from '@/components/TextField';
import { useResetPassword } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import type { AuthStackParamList } from '@/navigation/types';
import { getErrorMessage } from '@/utils/getErrorMessage';

type Props = NativeStackScreenProps<AuthStackParamList, 'ResetPassword'>;

export function ResetPasswordScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const [token, setToken] = useState(route.params?.token ?? '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const resetPassword = useResetPassword();

  const passwordsMatch = password === confirmPassword;
  const canSubmit = token.trim().length > 0 && password.length >= 8 && passwordsMatch;

  const handleSubmit = () => {
    resetPassword.mutate(
      { token: token.trim(), password },
      {
        onSuccess: (data) =>
          Alert.alert('Success', data.message, [
            { text: 'Sign in', onPress: () => navigation.navigate('Login') },
          ]),
        onError: (error) => Alert.alert('Reset failed', getErrorMessage(error)),
      },
    );
  };

  return (
    <ScreenContainer>
      <FadeInView style={styles.form}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Reset password</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Enter the code from your email and a new password.
          </Text>
        </View>

        <TextField
          label="Reset code"
          value={token}
          onChangeText={setToken}
          placeholder="Paste the code from your email"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TextField
          label="New password"
          value={password}
          onChangeText={setPassword}
          placeholder="At least 8 characters"
          secureTextEntry
          autoCapitalize="none"
          textContentType="newPassword"
        />
        <TextField
          label="Confirm password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Re-enter your password"
          secureTextEntry
          autoCapitalize="none"
          error={
            confirmPassword.length > 0 && !passwordsMatch ? 'Passwords do not match' : undefined
          }
        />

        <Button
          title="Reset password"
          onPress={handleSubmit}
          loading={resetPassword.isPending}
          disabled={!canSubmit}
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
