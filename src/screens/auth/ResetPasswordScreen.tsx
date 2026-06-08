import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { SuccessCheck } from '@/components/animations/SuccessCheck';
import { AuthHeader } from '@/components/auth/AuthHeader';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { GradientButton } from '@/components/buttons/GradientButton';
import { GlassCard } from '@/components/cards/GlassCard';
import { ArrowRightIcon, LockIcon, SparkleIcon } from '@/components/icons';
import { FloatingLabelInput } from '@/components/inputs/FloatingLabelInput';
import { PasswordStrength } from '@/components/inputs/PasswordStrength';
import { useResetPassword } from '@/hooks/useAuth';
import { useAuthTheme } from '@/theme/authTheme';
import { fontFamily } from '@/theme/typography';
import type { AuthStackParamList } from '@/navigation/types';
import { getErrorMessage } from '@/utils/getErrorMessage';

type Props = NativeStackScreenProps<AuthStackParamList, 'ResetPassword'>;

export function ResetPasswordScreen({ navigation, route }: Props) {
  const { c } = useAuthTheme();
  const resetPassword = useResetPassword();

  const [token, setToken] = useState(route.params?.token ?? '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [done, setDone] = useState(false);

  const passwordsMatch = password === confirm;
  const confirmError = confirm.length > 0 && !passwordsMatch ? 'Passwords do not match' : null;
  const canSubmit = token.trim().length > 0 && password.length >= 8 && passwordsMatch;

  const handleSubmit = () => {
    resetPassword.mutate(
      { token: token.trim(), password },
      {
        onSuccess: () => setDone(true),
        onError: (error) => Alert.alert('Reset failed', getErrorMessage(error)),
      },
    );
  };

  if (done) {
    return (
      <AuthLayout scroll={false}>
        <Animated.View entering={FadeIn.duration(400)} style={styles.successWrap}>
          <SuccessCheck size={104} />
          <Text style={[styles.successTitle, { color: c.text }]}>Password updated</Text>
          <Text style={[styles.successSub, { color: c.textMuted }]}>
            Your password has been reset. Sign in with your new credentials.
          </Text>
          <View style={styles.successAction}>
            <GradientButton
              title="Back to sign in"
              onPress={() => navigation.navigate('Login')}
              icon={<ArrowRightIcon size={20} color={c.onPrimary} />}
            />
          </View>
        </Animated.View>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout onBack={() => navigation.goBack()}>
      <AuthHeader compact tagline="Set a new password" />

      <GlassCard delay={120}>
        <View style={styles.form}>
          <FloatingLabelInput
            label="Reset code"
            value={token}
            onChangeText={setToken}
            icon={<SparkleIcon color={c.inputIcon} size={20} />}
            autoCapitalize="none"
            autoCorrect={false}
            success={token.trim().length > 0}
          />
          <FloatingLabelInput
            label="New password"
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
            title="Reset password"
            onPress={handleSubmit}
            loading={resetPassword.isPending}
            disabled={!canSubmit}
          />
        </View>
      </GlassCard>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  form: { gap: 16 },
  successWrap: { alignItems: 'center', gap: 14, paddingHorizontal: 8 },
  successTitle: { fontSize: 26, fontFamily: fontFamily.bold, marginTop: 8 },
  successSub: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
    maxWidth: 300,
  },
  successAction: { alignSelf: 'stretch', marginTop: 18 },
});
