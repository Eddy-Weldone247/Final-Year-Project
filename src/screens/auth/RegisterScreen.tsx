import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { AuthHeader } from '@/components/auth/AuthHeader';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { GradientButton } from '@/components/buttons/GradientButton';
import { GlassCard } from '@/components/cards/GlassCard';
import { LockIcon, MailIcon, UserIcon } from '@/components/icons';
import { FloatingLabelInput } from '@/components/inputs/FloatingLabelInput';
import { PasswordStrength } from '@/components/inputs/PasswordStrength';
import { useRegister } from '@/hooks/useAuth';
import { useAuthTheme } from '@/theme/authTheme';
import { fontFamily } from '@/theme/typography';
import type { AuthStackParamList } from '@/navigation/types';
import { getErrorMessage } from '@/utils/getErrorMessage';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

export function RegisterScreen({ navigation }: Props) {
  const { c } = useAuthTheme();
  const register = useRegister();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const emailValid = isValidEmail(email);
  const emailError = email.length > 0 && !emailValid ? 'Enter a valid email address' : null;
  const passwordsMatch = password === confirm;
  const confirmError = confirm.length > 0 && !passwordsMatch ? 'Passwords do not match' : null;

  const canSubmit = name.trim().length >= 2 && emailValid && password.length >= 8 && passwordsMatch;

  const handleSubmit = () => {
    register.mutate(
      { name: name.trim(), email: email.trim(), password },
      {
        onSuccess: () => navigation.navigate('VerifyEmail', { email: email.trim() }),
        onError: (error) => Alert.alert('Registration failed', getErrorMessage(error)),
      },
    );
  };

  return (
    <AuthLayout onBack={() => navigation.goBack()}>
      <AuthHeader compact tagline="Create your account in seconds" />

      <GlassCard delay={120}>
        <View style={styles.form}>
          <FloatingLabelInput
            label="Full name"
            value={name}
            onChangeText={setName}
            icon={<UserIcon color={c.inputIcon} />}
            autoCapitalize="words"
            autoComplete="name"
            success={name.trim().length >= 2}
          />
          <FloatingLabelInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            icon={<MailIcon color={c.inputIcon} />}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            error={emailError}
            success={emailValid}
          />
          <FloatingLabelInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            icon={<LockIcon color={c.inputIcon} />}
            secure
            autoCapitalize="none"
            textContentType="newPassword"
          />
          <PasswordStrength password={password} />
          <FloatingLabelInput
            label="Confirm password"
            value={confirm}
            onChangeText={setConfirm}
            icon={<LockIcon color={c.inputIcon} />}
            secure
            autoCapitalize="none"
            error={confirmError}
            success={confirm.length > 0 && passwordsMatch}
          />

          <GradientButton
            title="Create account"
            onPress={handleSubmit}
            loading={register.isPending}
            disabled={!canSubmit}
          />
        </View>
      </GlassCard>

      <Animated.View entering={FadeIn.duration(500).delay(360)} style={styles.bottom}>
        <Text style={[styles.bottomText, { color: c.textMuted }]}>Already have an account?</Text>
        <Pressable onPress={() => navigation.navigate('Login')} hitSlop={8}>
          <Text style={[styles.link, { color: c.primary }]}>Sign in</Text>
        </Pressable>
      </Animated.View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  form: { gap: 16 },
  bottom: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 22,
  },
  bottomText: { fontSize: 14, fontFamily: fontFamily.regular },
  link: { fontSize: 14, fontFamily: fontFamily.semibold },
});
