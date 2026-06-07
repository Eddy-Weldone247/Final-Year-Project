import { BlurView } from 'expo-blur';
import { type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/animations/PressableScale';
import { useAuthTheme } from '@/theme/authTheme';
import { fontFamily } from '@/theme/typography';

interface GlassButtonProps {
  title: string;
  onPress: () => void;
  icon?: ReactNode;
  disabled?: boolean;
}

/** Outlined frosted-glass button — secondary action style. */
export function GlassButton({ title, onPress, icon, disabled }: GlassButtonProps) {
  const { c } = useAuthTheme();
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      style={styles.wrap}
      accessibilityLabel={title}
    >
      <BlurView
        intensity={c.blurIntensity}
        tint={c.blurTint}
        experimentalBlurMethod="dimezisBlurView"
        style={styles.clip}
      >
        <View style={[styles.inner, { backgroundColor: c.glassBg, borderColor: c.glassBorder }]}>
          {icon ? <View style={styles.icon}>{icon}</View> : null}
          <Text style={[styles.label, { color: c.text }]}>{title}</Text>
        </View>
      </BlurView>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: 16 },
  clip: { borderRadius: 16, overflow: 'hidden' },
  inner: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 18,
  },
  icon: { marginTop: 1 },
  label: { fontSize: 16, fontFamily: fontFamily.semibold },
});
