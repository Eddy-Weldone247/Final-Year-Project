import { BlurView } from 'expo-blur';
import { type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PressableScale } from '@/components/animations/PressableScale';
import { ChevronLeftIcon } from '@/components/icons';
import { AnimatedBackground } from '@/components/animations/AnimatedBackground';
import { useAuthTheme } from '@/theme/authTheme';

interface AuthLayoutProps {
  children: ReactNode;
  /** Show a frosted back button (top-left) wired to this handler. */
  onBack?: () => void;
  /** Wrap content in a scroll view (default true). */
  scroll?: boolean;
}

/** Shared shell for auth screens: animated backdrop + safe area + keyboard handling. */
export function AuthLayout({ children, onBack, scroll = true }: AuthLayoutProps) {
  const { c } = useAuthTheme();

  const content = scroll ? (
    <ScrollView
      contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={styles.fill}>{children}</View>
  );

  return (
    <View style={[styles.root, { backgroundColor: c.gradient[0] }]}>
      <AnimatedBackground />
      <SafeAreaView style={styles.fill} edges={['top', 'bottom']}>
        {onBack ? (
          <Animated.View entering={FadeIn.duration(400)} style={styles.backWrap}>
            <PressableScale onPress={onBack} accessibilityLabel="Go back" style={styles.backShadow}>
              <BlurView
                intensity={c.blurIntensity}
                tint={c.blurTint}
                experimentalBlurMethod="dimezisBlurView"
                style={styles.backClip}
              >
                <View
                  style={[styles.back, { backgroundColor: c.glassBg, borderColor: c.glassBorder }]}
                >
                  <ChevronLeftIcon color={c.text} size={22} />
                </View>
              </BlurView>
            </PressableScale>
          </Animated.View>
        ) : null}
        <KeyboardAvoidingView
          style={styles.fill}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {content}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  fill: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 28 },
  backWrap: { paddingHorizontal: 20, paddingTop: 4 },
  backShadow: { width: 44, height: 44, borderRadius: 14 },
  backClip: { borderRadius: 14, overflow: 'hidden' },
  back: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
