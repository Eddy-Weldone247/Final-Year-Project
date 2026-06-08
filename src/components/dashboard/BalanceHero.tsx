import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

import { GlassCard } from '@/components/cards/GlassCard';
import { useAuthTheme } from '@/theme/authTheme';
import { fontFamily } from '@/theme/typography';
import type { DailyTotal } from '@/types/stats';

import { AnimatedCounter } from './AnimatedCounter';

interface BalanceHeroProps {
  balance: number;
  income: number;
  expense: number;
  daily: DailyTotal[];
}

/** Builds a continuous day-1..today series for the current month (UTC keys). */
function dailyPoints(data: DailyTotal[]) {
  const byDay = new Map(data.map((d) => [d.date, d.expense]));
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const today = now.getUTCDate();
  const points: { value: number }[] = [];
  for (let day = 1; day <= today; day += 1) {
    const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    points.push({ value: byDay.get(key) ?? 0 });
  }
  return points;
}

/**
 * Financial overview hero — frosted glass, count-up total balance, this month's
 * income/expense, and a smoothly-rendered spending sparkline (Coinbase-style).
 */
export function BalanceHero({ balance, income, expense, daily }: BalanceHeroProps) {
  const { c } = useAuthTheme();
  const { width } = useWindowDimensions();
  const points = dailyPoints(daily);
  const chartWidth = width - 20 * 2 - 24 * 2; // screen padding + card padding
  const maxValue = Math.max(1, ...points.map((p) => p.value)) * 1.2;

  return (
    <GlassCard delay={80}>
      <Text style={[styles.label, { color: c.textMuted }]}>Total balance</Text>
      <AnimatedCounter value={balance} style={[styles.balance, { color: c.text }]} />

      <View style={styles.row}>
        <View style={styles.col}>
          <View style={styles.metaRow}>
            <View style={[styles.dot, { backgroundColor: c.success }]} />
            <Text style={[styles.colLabel, { color: c.textMuted }]}>Income</Text>
          </View>
          <AnimatedCounter value={income} style={[styles.colValue, { color: c.text }]} />
        </View>

        <View style={[styles.divider, { backgroundColor: c.glassBorder }]} />

        <View style={styles.col}>
          <View style={styles.metaRow}>
            <View style={[styles.dot, { backgroundColor: c.danger }]} />
            <Text style={[styles.colLabel, { color: c.textMuted }]}>Spent</Text>
          </View>
          <AnimatedCounter value={expense} style={[styles.colValue, { color: c.text }]} />
        </View>
      </View>

      {points.length > 1 ? (
        <View style={styles.chart} pointerEvents="none">
          <LineChart
            data={points}
            curved
            areaChart
            color={c.primary}
            startFillColor={c.primary}
            endFillColor={c.primary}
            startOpacity={0.28}
            endOpacity={0.02}
            thickness={2.5}
            hideDataPoints
            hideRules
            hideYAxisText
            hideAxesAndRules
            adjustToWidth
            maxValue={maxValue}
            width={chartWidth}
            height={68}
            initialSpacing={0}
            endSpacing={0}
            yAxisThickness={0}
            xAxisThickness={0}
            isAnimated
            disableScroll
          />
        </View>
      ) : null}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 14, fontFamily: fontFamily.medium },
  balance: { fontSize: 40, fontFamily: fontFamily.extrabold, letterSpacing: -0.6, marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 18 },
  col: { flex: 1, gap: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  colLabel: { fontSize: 13, fontFamily: fontFamily.medium },
  colValue: { fontSize: 19, fontFamily: fontFamily.bold },
  divider: { width: 1, height: 38, marginHorizontal: 18 },
  chart: { marginTop: 18, marginHorizontal: -6, overflow: 'hidden' },
});
