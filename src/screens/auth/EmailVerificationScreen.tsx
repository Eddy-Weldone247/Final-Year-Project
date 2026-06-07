import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { SuccessCheck } from '@/components/animations/SuccessCheck';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { GradientButton } from '@/components/buttons/GradientButton';
import { GlassCard } from '@/components/cards/GlassCard';
import { ArrowRightIcon, MailIcon } from '@/components/icons';
import { FloatingLabelInput } from '@/components/inputs/FloatingLabelInput';
import { useVerifyEmail } from '@/hooks/useAuth';
import { useAuthTheme } from '@/theme/authTheme';
import { fontFamily } from '@/theme/typography';
import type { AuthStackParamList } from '@/navigation/types';
import { getErrorMessage } from '@/utils/getErrorMessage';

type Props = NativeStackScreenProps<AuthStackParamList, 'VerifyEmail'>;

/** A soft pulsing glass badge housing the mail icon. */
function MailBadge() {
  const { c } = useAuthTheme();
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [pulse]);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 0.06 }],
    shadowOpacity: 0.3 + pulse.value * 0.3,
  }));
  return (
    <Animated.View
      style={[styles.badge, { backgroundColor: `${c.primary}22`, shadowColor: c.glow }, style]}
    >
      <MailIcon size={34} color={c.primary} strokeWidth={1.6} />
    </Animated.View>
  );
}

export function EmailVerificationScreen({ navigation, route }: Props) {
  const { c } = useAuthTheme();
  const email = route.params?.email;
  const verify = useVerifyEmail();

  const [code, setCode] = useState('');
  const [verified, setVerified] = useState(false);

  const handleVerify = () => {
    verify.mutate(
      { token: code.trim() },
      {
        onSuccess: () => setVerified(true),
        onError: (error) => Alert.alert('Verification failed', getErrorMessage(error)),
      },
    );
  };

  const resend = () =>
    Alert.alert(
      'Check your inbox',
      `We've sent a verification link${email ? ` to ${email}` : ''}. Tap the link, or paste the code here. Don't forget to check your spam folder.`,
    );

  if (verified) {
    return (
      <AuthLayout scroll={false}>
        <Animated.View entering={FadeIn.duration(400)} style={styles.successWrap}>
          <SuccessCheck size={104} />
          <Text style={[styles.successTitle, { color: c.text }]}>Email verified</Text>
          <Text style={[styles.successSub, { color: c.textMuted }]}>
            You&apos;re all set. Sign in to start tracking smarter.
          </Text>
          <View style={styles.successAction}>
            <GradientButton
              title="Continue to sign in"
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
      <Animated.View entering={FadeIn.duration(500)} style={styles.head}>
        <MailBadge />
        <Text style={[styles.title, { color: c.text }]}>Verify your email</Text>
        <Text style={[styles.sub, { color: c.textMuted }]}>
          We sent a verification link to{'\n'}
          <Text style={{ color: c.text, fontFamily: fontFamily.semibold }}>
            {email ?? 'your email address'}
          </Text>
        </Text>
      </Animated.View>

      <GlassCard delay={140}>
        <View style={styles.form}>
          <Text style={[styles.lead, { color: c.textMuted }]}>
            Tap the link in the email, or paste the verification code below.
          </Text>
          <FloatingLabelInput
            label="Verification code"
            value={code}
            onChangeText={setCode}
            icon={<MailIcon color={c.inputIcon} />}
            autoCapitalize="none"
            autoCorrect={false}
            success={code.trim().length > 0}
          />
          <GradientButton
            title="Verify email"
            onPress={handleVerify}
            loading={verify.isPending}
            disabled={code.trim().length === 0}
          />
        </View>
      </GlassCard>

      <Animated.View entering={FadeIn.duration(500).delay(320)} style={styles.bottom}>
        <Text style={[styles.bottomText, { color: c.textMuted }]}>Didn&apos;t get it?</Text>
        <Pressable onPress={resend} hitSlop={8}>
          <Text style={[styles.link, { color: c.primary }]}>Resend</Text>
        </Pressable>
      </Animated.View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  head: { alignItems: 'center', gap: 12, marginBottom: 24 },
  badge: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 22,
    elevation: 8,
  },
  title: { fontSize: 28, fontFamily: fontFamily.bold, marginTop: 4 },
  sub: { fontSize: 15, lineHeight: 22, fontFamily: fontFamily.regular, textAlign: 'center' },
  form: { gap: 16 },
  lead: { fontSize: 14, lineHeight: 21, fontFamily: fontFamily.regular },
  bottom: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 22,
  },
  bottomText: { fontSize: 14, fontFamily: fontFamily.regular },
  link: { fontSize: 14, fontFamily: fontFamily.semibold },
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
