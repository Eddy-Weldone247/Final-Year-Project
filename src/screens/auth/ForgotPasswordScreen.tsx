import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { AuthHeader } from '@/components/auth/AuthHeader';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { GradientButton } from '@/components/buttons/GradientButton';
import { GlassButton } from '@/components/buttons/GlassButton';
import { GlassCard } from '@/components/cards/GlassCard';
import { ArrowRightIcon, MailIcon } from '@/components/icons';
import { FloatingLabelInput } from '@/components/inputs/FloatingLabelInput';
import { useForgotPassword } from '@/hooks/useAuth';
import { useAuthTheme } from '@/theme/authTheme';
import { fontFamily } from '@/theme/typography';
import type { AuthStackParamList } from '@/navigation/types';
import { getErrorMessage } from '@/utils/getErrorMessage';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

export function ForgotPasswordScreen({ navigation }: Props) {
  const { c } = useAuthTheme();
  const forgotPassword = useForgotPassword();
  const [email, setEmail] = useState('');

  const emailValid = isValidEmail(email);

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
    <AuthLayout onBack={() => navigation.goBack()}>
      <AuthHeader compact tagline="Reset your password" />

      <GlassCard delay={120}>
        <View style={styles.form}>
          <Text style={[styles.lead, { color: c.textMuted }]}>
            Enter the email tied to your account and we&apos;ll send a secure code to reset your
            password.
          </Text>
          <FloatingLabelInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            icon={<MailIcon color={c.inputIcon} />}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            success={emailValid}
          />
          <GradientButton
            title="Send reset code"
            onPress={handleSubmit}
            loading={forgotPassword.isPending}
            disabled={!emailValid}
            icon={<ArrowRightIcon size={20} color={c.onPrimary} />}
          />
          <GlassButton
            title="I already have a code"
            onPress={() => navigation.navigate('ResetPassword', {})}
          />
        </View>
      </GlassCard>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  form: { gap: 16 },
  lead: { fontSize: 15, lineHeight: 22, fontFamily: fontFamily.regular },
});
