import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { BlurView } from 'expo-blur';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { AuthLayout } from '@/components/auth/AuthLayout';
import { GlassButton } from '@/components/buttons/GlassButton';
import { GradientButton } from '@/components/buttons/GradientButton';
import { ArrowRightIcon, LogoMark, MailIcon, ShieldIcon, SparkleIcon } from '@/components/icons';
import { useAuthTheme } from '@/theme/authTheme';
import { fontFamily } from '@/theme/typography';
import type { AuthStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

const FEATURES = [
  { key: 'ai', label: 'AI insights' },
  { key: 'budgets', label: 'Smart budgets' },
  { key: 'sms', label: 'SMS auto-capture' },
];

export function WelcomeScreen({ navigation }: Props) {
  const { c } = useAuthTheme();

  const featureIcon = (key: string) => {
    if (key === 'ai') return <SparkleIcon size={16} color={c.accent} />;
    if (key === 'budgets') return <ShieldIcon size={16} color={c.success} />;
    return <MailIcon size={16} color={c.primary} />;
  };

  return (
    <AuthLayout scroll>
      <View style={styles.hero}>
        <Animated.View
          entering={FadeInDown.duration(640)}
          style={[styles.logo, { shadowColor: c.glow }]}
        >
          <LogoMark size={84} />
        </Animated.View>

        <Animated.Text
          entering={FadeInDown.duration(640).delay(120)}
          style={[styles.headline, { color: c.text }]}
        >
          Money, beautifully managed.
        </Animated.Text>
        <Animated.Text
          entering={FadeInDown.duration(640).delay(220)}
          style={[styles.sub, { color: c.textMuted }]}
        >
          Track spending, set budgets, and let AI forecast what&apos;s next — all in one elegant
          place.
        </Animated.Text>

        <Animated.View entering={FadeInUp.duration(640).delay(320)} style={styles.chips}>
          {FEATURES.map((f) => (
            <BlurView
              key={f.key}
              intensity={c.blurIntensity}
              tint={c.blurTint}
              experimentalBlurMethod="dimezisBlurView"
              style={styles.chipClip}
            >
              <View
                style={[styles.chip, { backgroundColor: c.glassBg, borderColor: c.glassBorder }]}
              >
                {featureIcon(f.key)}
                <Text style={[styles.chipText, { color: c.text }]}>{f.label}</Text>
              </View>
            </BlurView>
          ))}
        </Animated.View>
      </View>

      <Animated.View entering={FadeInUp.duration(640).delay(440)} style={styles.actions}>
        <GradientButton
          title="Get started"
          onPress={() => navigation.navigate('Register')}
          icon={<ArrowRightIcon size={20} color={c.onPrimary} />}
        />
        <GlassButton
          title="I already have an account"
          onPress={() => navigation.navigate('Login')}
        />
      </Animated.View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: 16 },
  logo: {
    borderRadius: 26,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.55,
    shadowRadius: 26,
    elevation: 14,
    marginBottom: 6,
  },
  headline: {
    fontSize: 32,
    lineHeight: 38,
    fontFamily: fontFamily.bold,
    textAlign: 'center',
    letterSpacing: -0.5,
    maxWidth: 320,
  },
  sub: {
    fontSize: 16,
    lineHeight: 23,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
    maxWidth: 320,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginTop: 8,
  },
  chipClip: { borderRadius: 999, overflow: 'hidden' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: { fontSize: 13, fontFamily: fontFamily.semibold },
  actions: { gap: 14, marginTop: 40 },
});
