import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { FadeInView } from '@/components/FadeInView';
import { ScreenContainer } from '@/components/ScreenContainer';
import { TextField } from '@/components/TextField';
import { useRegister } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import type { AuthStackParamList } from '@/navigation/types';
import { getErrorMessage } from '@/utils/getErrorMessage';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const register = useRegister();

  const passwordsMatch = password === confirmPassword;
  const canSubmit =
    name.trim().length >= 2 && email.trim().length > 0 && password.length >= 8 && passwordsMatch;

  const handleSubmit = () => {
    register.mutate(
      { name: name.trim(), email: email.trim(), password },
      {
        onSuccess: (data) =>
          Alert.alert('Almost there', data.message, [
            { text: 'OK', onPress: () => navigation.navigate('Login') },
          ]),
        onError: (error) => Alert.alert('Registration failed', getErrorMessage(error)),
      },
    );
  };

  return (
    <ScreenContainer>
      <FadeInView style={styles.form}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Create account</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Start tracking your expenses with ExpenSee
          </Text>
        </View>

        <TextField
          label="Name"
          value={name}
          onChangeText={setName}
          placeholder="Jane Doe"
          autoCapitalize="words"
          autoComplete="name"
        />
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
        <TextField
          label="Password"
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
          title="Create account"
          onPress={handleSubmit}
          loading={register.isPending}
          disabled={!canSubmit}
        />

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textMuted }]}>
            Already have an account?
          </Text>
          <Button title="Sign in" variant="ghost" onPress={() => navigation.navigate('Login')} />
        </View>
      </FadeInView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  form: { gap: 16 },
  header: { gap: 6, marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '700' },
  subtitle: { fontSize: 15 },
  footer: { alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  footerText: { fontSize: 14 },
});
