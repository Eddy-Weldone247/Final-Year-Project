import { BlurView } from 'expo-blur';
import { type ElementRef, type ReactNode, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  interpolate,
  type SharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedBackground } from '@/components/animations/AnimatedBackground';
import { GradientButton } from '@/components/buttons/GradientButton';
import { ArrowRightIcon } from '@/components/icons';
import {
  AIPredictArt,
  AutoTrackArt,
  BudgetArt,
  WelcomeArt,
} from '@/components/onboarding/illustrations';
import { ProgressDots } from '@/components/onboarding/ProgressDots';
import { useOnboardingStore } from '@/store/onboardingStore';
import { useAuthTheme } from '@/theme/authTheme';
import { fontFamily } from '@/theme/typography';

interface Page {
  art: ReactNode;
  title: string;
  subtitle: string;
}

const PAGES: Page[] = [
  {
    art: <WelcomeArt />,
    title: 'Welcome to ExpenSee',
    subtitle: "Your money, beautifully organized. Let's get you set up in under a minute.",
  },
  {
    art: <AutoTrackArt />,
    title: 'Track expenses automatically',
    subtitle:
      'We read your bank & mobile-money alerts and turn them into clean transactions — no manual entry.',
  },
  {
    art: <BudgetArt />,
    title: 'Smart budgeting',
    subtitle: 'Set monthly limits, watch live progress, and get nudged before you overspend.',
  },
  {
    art: <AIPredictArt />,
    title: 'AI predictions',
    subtitle:
      'Machine learning forecasts your spending for the days ahead, so there are no surprises.',
  },
];

function OnboardPage({
  page,
  index,
  scrollX,
  width,
}: {
  page: Page;
  index: number;
  scrollX: SharedValue<number>;
  width: number;
}) {
  const { c } = useAuthTheme();
  const input = [(index - 1) * width, index * width, (index + 1) * width];

  const artStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollX.value, input, [0, 1, 0], 'clamp'),
    transform: [
      { translateX: interpolate(scrollX.value, input, [width * 0.5, 0, -width * 0.5], 'clamp') },
      { scale: interpolate(scrollX.value, input, [0.84, 1, 0.84], 'clamp') },
    ],
  }));
  const cardStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollX.value, input, [0, 1, 0], 'clamp'),
    transform: [
      { translateX: interpolate(scrollX.value, input, [width * 0.22, 0, -width * 0.22], 'clamp') },
    ],
  }));

  return (
    <View style={{ width }}>
      <Animated.View style={[styles.artArea, artStyle]}>{page.art}</Animated.View>
      <Animated.View style={[styles.cardArea, cardStyle]}>
        <BlurView
          intensity={c.blurIntensity}
          tint={c.blurTint}
          experimentalBlurMethod="dimezisBlurView"
          style={styles.cardClip}
        >
          <View style={[styles.card, { backgroundColor: c.glassBg, borderColor: c.glassBorder }]}>
            <View
              pointerEvents="none"
              style={[styles.cardHighlight, { backgroundColor: c.glassHighlight }]}
            />
            <Text style={[styles.title, { color: c.text }]}>{page.title}</Text>
            <Text style={[styles.subtitle, { color: c.textMuted }]}>{page.subtitle}</Text>
          </View>
        </BlurView>
      </Animated.View>
    </View>
  );
}

export function OnboardingScreen() {
  const { c } = useAuthTheme();
  const { width } = useWindowDimensions();
  const setOnboarded = useOnboardingStore((s) => s.setOnboarded);

  const scrollRef = useRef<ElementRef<typeof Animated.ScrollView>>(null);
  const scrollX = useSharedValue(0);
  const [index, setIndex] = useState(0);

  const onScroll = useAnimatedScrollHandler((e) => {
    scrollX.value = e.contentOffset.x;
  });

  const isLast = index === PAGES.length - 1;

  const handleNext = () => {
    if (isLast) {
      setOnboarded();
    } else {
      scrollRef.current?.scrollTo({ x: (index + 1) * width, animated: true });
    }
  };

  const skipStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollX.value,
      [(PAGES.length - 2) * width, (PAGES.length - 1) * width],
      [1, 0],
      'clamp',
    ),
  }));

  return (
    <View style={[styles.root, { backgroundColor: c.gradient[0] }]}>
      <AnimatedBackground />
      <SafeAreaView style={styles.fill} edges={['top', 'bottom']}>
        <Animated.View
          style={[styles.skipWrap, skipStyle]}
          pointerEvents={isLast ? 'none' : 'auto'}
        >
          <Pressable onPress={setOnboarded} hitSlop={12} accessibilityRole="button">
            <Text style={[styles.skip, { color: c.textMuted }]}>Skip</Text>
          </Pressable>
        </Animated.View>

        <Animated.ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
        >
          {PAGES.map((page, i) => (
            <OnboardPage key={i} page={page} index={i} scrollX={scrollX} width={width} />
          ))}
        </Animated.ScrollView>

        <View style={styles.footer}>
          <ProgressDots count={PAGES.length} scrollX={scrollX} width={width} />
          <GradientButton
            title={isLast ? 'Get Started' : 'Continue'}
            onPress={handleNext}
            icon={<ArrowRightIcon size={20} color={c.onPrimary} />}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  fill: { flex: 1 },
  skipWrap: { alignItems: 'flex-end', paddingHorizontal: 24, paddingTop: 4, height: 28 },
  skip: { fontSize: 15, fontFamily: fontFamily.semibold },
  artArea: { flex: 1, paddingHorizontal: 24 },
  cardArea: { paddingHorizontal: 24, paddingBottom: 8 },
  cardClip: { borderRadius: 28, overflow: 'hidden' },
  card: { borderRadius: 28, borderWidth: 1, padding: 24, gap: 10 },
  cardHighlight: { position: 'absolute', top: 0, left: 32, right: 32, height: 1, opacity: 0.7 },
  title: { fontSize: 28, fontFamily: fontFamily.bold, letterSpacing: -0.4 },
  subtitle: { fontSize: 16, lineHeight: 23, fontFamily: fontFamily.regular },
  footer: { paddingHorizontal: 24, paddingTop: 18, paddingBottom: 8, gap: 22 },
});
