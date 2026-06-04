import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { FadeInView } from '@/components/FadeInView';
import { ScreenContainer } from '@/components/ScreenContainer';
import { TextField } from '@/components/TextField';
import { config } from '@/constants/config';
import { useLogin } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import type { AuthStackParamList } from '@/navigation/types';
import { getErrorMessage } from '@/utils/getErrorMessage';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const login = useLogin();

  const canSubmit = email.trim().length > 0 && password.length > 0;

  const handleSubmit = () => {
    login.mutate(
      { email: email.trim(), password },
      { onError: (error) => Alert.alert('Sign in failed', getErrorMessage(error)) },
    );
  };

  // DEV ONLY: log in with the demo account to skip the form during testing.
  const handleDevSkip = () => {
    login.mutate(
      { email: config.devEmail, password: config.devPassword },
      { onError: (error) => Alert.alert('Dev login failed', getErrorMessage(error)) },
    );
  };

  return (
    <ScreenContainer>
      <FadeInView style={styles.form}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Welcome back</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Sign in to your ExpenSee account
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
        <TextField
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry
          autoCapitalize="none"
          textContentType="password"
        />

        <Button
          title="Sign In"
          onPress={handleSubmit}
          loading={login.isPending}
          disabled={!canSubmit}
        />
        <Button
          title="Forgot password?"
          variant="ghost"
          onPress={() => navigation.navigate('ForgotPassword')}
        />

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textMuted }]}>
            Don&apos;t have an account?
          </Text>
          <Button
            title="Create one"
            variant="ghost"
            onPress={() => navigation.navigate('Register')}
          />
        </View>

        {__DEV__ ? (
          <View style={[styles.devBox, { borderColor: colors.border }]}>
            <Text style={[styles.devLabel, { color: colors.placeholder }]}>Development</Text>
            <Button
              title="Skip login (dev)"
              variant="ghost"
              onPress={handleDevSkip}
              loading={login.isPending}
            />
          </View>
        ) : null}
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
  devBox: {
    borderRadius: 10,
    borderStyle: 'dashed',
    borderWidth: 1,
    marginTop: 16,
    paddingTop: 8,
  },
  devLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
});
