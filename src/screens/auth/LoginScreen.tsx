import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { PressableScale } from '@/components/animations/PressableScale';
import { AuthHeader } from '@/components/auth/AuthHeader';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { GradientButton } from '@/components/buttons/GradientButton';
import { SocialButton } from '@/components/buttons/SocialButton';
import { GlassCard } from '@/components/cards/GlassCard';
import { ArrowRightIcon, LockIcon, MailIcon } from '@/components/icons';
import { Checkbox } from '@/components/inputs/Checkbox';
import { FloatingLabelInput } from '@/components/inputs/FloatingLabelInput';
import { config } from '@/constants/config';
import { useLogin } from '@/hooks/useAuth';
import { useRememberedEmail } from '@/hooks/useRememberedEmail';
import { useAuthTheme } from '@/theme/authTheme';
import { fontFamily } from '@/theme/typography';
import type { AuthStackParamList } from '@/navigation/types';
import { getErrorMessage } from '@/utils/getErrorMessage';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

export function LoginScreen({ navigation }: Props) {
  const { c } = useAuthTheme();
  const login = useLogin();
  const { initialEmail, remember, setRemember, persist, loaded } = useRememberedEmail();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (loaded && initialEmail) setEmail(initialEmail);
  }, [loaded, initialEmail]);

  const emailValid = isValidEmail(email);
  const emailError = email.length > 0 && !emailValid ? 'Enter a valid email address' : null;
  const canSubmit = emailValid && password.length > 0;

  const handleSubmit = () => {
    void persist(email);
    login.mutate(
      { email: email.trim(), password },
      { onError: (error) => Alert.alert('Sign in failed', getErrorMessage(error)) },
    );
  };

  const handleDevSkip = () => {
    login.mutate(
      { email: config.devEmail, password: config.devPassword },
      { onError: (error) => Alert.alert('Dev login failed', getErrorMessage(error)) },
    );
  };

  const social = () =>
    Alert.alert('Coming soon', 'Social sign-in is on the way. Use your email for now.');

  return (
    <AuthLayout onBack={() => navigation.goBack()}>
      <AuthHeader compact tagline="Welcome back — sign in to continue" />

      <GlassCard delay={120}>
        <View style={styles.form}>
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
            textContentType="password"
          />

          <View style={styles.metaRow}>
            <Checkbox checked={remember} onChange={setRemember} label="Remember me" />
            <Pressable onPress={() => navigation.navigate('ForgotPassword')} hitSlop={8}>
              <Text style={[styles.link, { color: c.primary }]}>Forgot password?</Text>
            </Pressable>
          </View>

          <GradientButton
            title="Sign in"
            onPress={handleSubmit}
            loading={login.isPending}
            disabled={!canSubmit}
            icon={<ArrowRightIcon size={20} color={c.onPrimary} />}
          />

          <View style={styles.divider}>
            <View style={[styles.line, { backgroundColor: c.inputBorder }]} />
            <Text style={[styles.dividerText, { color: c.textFaint }]}>or continue with</Text>
            <View style={[styles.line, { backgroundColor: c.inputBorder }]} />
          </View>

          <View style={styles.social}>
            <View style={styles.socialItem}>
              <SocialButton provider="google" onPress={social} />
            </View>
            <View style={styles.socialItem}>
              <SocialButton provider="apple" onPress={social} />
            </View>
          </View>
        </View>
      </GlassCard>

      <Animated.View entering={FadeIn.duration(500).delay(360)} style={styles.bottom}>
        <Text style={[styles.bottomText, { color: c.textMuted }]}>Don&apos;t have an account?</Text>
        <Pressable onPress={() => navigation.navigate('Register')} hitSlop={8}>
          <Text style={[styles.link, { color: c.primary }]}>Create one</Text>
        </Pressable>
      </Animated.View>

      {__DEV__ ? (
        <PressableScale
          onPress={handleDevSkip}
          style={styles.dev}
          accessibilityLabel="Skip login (dev)"
        >
          <Text style={[styles.devText, { color: c.textFaint }]}>Skip login (dev)</Text>
        </PressableScale>
      ) : null}
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  form: { gap: 16 },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  link: { fontSize: 13, fontFamily: fontFamily.semibold },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  line: { flex: 1, height: 1 },
  dividerText: { fontSize: 12, fontFamily: fontFamily.medium },
  social: { flexDirection: 'row', gap: 12 },
  socialItem: { flex: 1 },
  bottom: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 22,
  },
  bottomText: { fontSize: 14, fontFamily: fontFamily.regular },
  dev: { alignSelf: 'center', marginTop: 14, paddingVertical: 6, paddingHorizontal: 12 },
  devText: { fontSize: 12, fontFamily: fontFamily.medium },
});
