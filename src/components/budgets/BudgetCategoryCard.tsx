import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { PressableScale } from '@/components/animations/PressableScale';
import type { CategoryMeta } from '@/constants/categories';
import { useAuthTheme } from '@/theme/authTheme';
import { fontFamily } from '@/theme/typography';
import type { BudgetProgress } from '@/types/budget';
import { formatCurrency } from '@/utils/formatCurrency';

import { budgetStatusColor } from './budgetStatus';

interface Props {
  meta: CategoryMeta;
  budget?: BudgetProgress | null;
  index?: number;
  onPress: () => void;
}

export function BudgetCategoryCard({ meta, budget, index = 0, onPress }: Props) {
  const { c } = useAuthTheme();
  const color = budget ? budgetStatusColor(budget.status, c) : c.textMuted;

  const fill = useSharedValue(0);
  useEffect(() => {
    fill.value = budget
      ? withDelay(
          120 + index * 80,
          withTiming(Math.min(budget.percent, 100) / 100, {
            duration: 800,
            easing: Easing.out(Easing.cubic),
          }),
        )
      : 0;
  }, [budget, index, fill]);
  const fillStyle = useAnimatedStyle(() => ({ width: `${fill.value * 100}%` }));

  return (
    <PressableScale onPress={onPress} scaleTo={0.98} accessibilityLabel={`${meta.label} budget`}>
      <View style={[styles.card, { backgroundColor: c.glassBg, borderColor: c.glassBorder }]}>
        <View style={styles.header}>
          <View style={[styles.icon, { backgroundColor: `${meta.color}29` }]}>
            <Text style={styles.emoji}>{meta.icon}</Text>
          </View>
          <Text style={[styles.label, { color: c.text }]}>{meta.label}</Text>
          {budget ? (
            <Text style={[styles.percent, { color }]}>{budget.percent}%</Text>
          ) : (
            <Text style={[styles.set, { color: c.primary }]}>Set budget ›</Text>
          )}
        </View>

        {budget ? (
          <>
            <Text style={[styles.amounts, { color: c.text }]}>
              {formatCurrency(budget.spent)}{' '}
              <Text style={[styles.muted, { color: c.textMuted }]}>
                of {formatCurrency(budget.amount)}
              </Text>
            </Text>
            <View style={[styles.track, { backgroundColor: c.inputBorder }]}>
              <Animated.View style={[styles.fill, { backgroundColor: color }, fillStyle]} />
            </View>
            <Text
              style={[styles.remaining, { color: budget.remaining < 0 ? c.danger : c.textMuted }]}
            >
              {budget.remaining >= 0
                ? `${formatCurrency(budget.remaining)} left`
                : `${formatCurrency(Math.abs(budget.remaining))} over budget`}
            </Text>
          </>
        ) : (
          <Text style={[styles.muted, { color: c.textMuted }]}>
            Tap to set a monthly limit for {meta.label.toLowerCase()}.
          </Text>
        )}
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 18, borderWidth: 1, padding: 16, gap: 10 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 19 },
  label: { flex: 1, fontSize: 16, fontFamily: fontFamily.semibold },
  percent: { fontSize: 16, fontFamily: fontFamily.bold },
  set: { fontSize: 14, fontFamily: fontFamily.semibold },
  amounts: { fontSize: 15, fontFamily: fontFamily.semibold },
  muted: { fontSize: 13, fontFamily: fontFamily.regular },
  track: { height: 10, borderRadius: 5, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 5 },
  remaining: { fontSize: 13, fontFamily: fontFamily.medium },
});
