import { BlurView } from 'expo-blur';
import { StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/animations/PressableScale';
import { AppleIcon, GoogleIcon } from '@/components/icons';
import { useAuthTheme } from '@/theme/authTheme';
import { fontFamily } from '@/theme/typography';

interface SocialButtonProps {
  provider: 'google' | 'apple';
  onPress: () => void;
}

/** Branded social sign-in button in a frosted-glass pill. */
export function SocialButton({ provider, onPress }: SocialButtonProps) {
  const { c, isDark } = useAuthTheme();
  const isGoogle = provider === 'google';
  const label = isGoogle ? 'Google' : 'Apple';

  return (
    <PressableScale
      onPress={onPress}
      style={styles.wrap}
      accessibilityLabel={`Continue with ${label}`}
    >
      <BlurView
        intensity={c.blurIntensity}
        tint={c.blurTint}
        experimentalBlurMethod="dimezisBlurView"
        style={styles.clip}
      >
        <View style={[styles.inner, { backgroundColor: c.glassBg, borderColor: c.glassBorder }]}>
          <View style={styles.icon}>
            {isGoogle ? (
              <GoogleIcon size={20} />
            ) : (
              <AppleIcon size={20} color={isDark ? '#FFFFFF' : '#0F172A'} />
            )}
          </View>
          <Text style={[styles.label, { color: c.text }]} numberOfLines={1}>
            {label}
          </Text>
        </View>
      </BlurView>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: 16, flex: 1 },
  clip: { borderRadius: 16, overflow: 'hidden' },
  inner: {
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 12,
  },
  icon: { width: 20, alignItems: 'center' },
  label: { fontSize: 15, fontFamily: fontFamily.semibold },
});
