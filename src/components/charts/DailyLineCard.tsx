import { Dimensions, StyleSheet, Text } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

import { Card } from '@/components/Card';
import { useTheme } from '@/hooks/useTheme';
import type { DailyTotal } from '@/types/stats';

function niceMax(value: number): number {
  if (value <= 0) return 100;
  const pow = Math.pow(10, Math.floor(Math.log10(value)));
  return Math.ceil(value / pow) * pow;
}

export function DailyLineCard({ data }: { data: DailyTotal[] }) {
  const { colors } = useTheme();
  const width = Dimensions.get('window').width - 32 - 32;

  // Build a continuous series for day 1..today of the current month (UTC, to
  // match the backend's day keys), filling missing days with 0.
  const expenseByDay = new Map(data.map((d) => [d.date, d.expense]));
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const today = now.getUTCDate();

  const points = [];
  for (let day = 1; day <= today; day += 1) {
    const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    points.push({
      value: expenseByDay.get(key) ?? 0,
      label: day === 1 || day % 5 === 0 ? String(day) : '',
    });
  }

  const maxValue = niceMax(Math.max(1, ...points.map((p) => p.value)));
  const spacing = Math.max(6, Math.floor((width - 16) / Math.max(points.length - 1, 1)));
  const axisText = { color: colors.textMuted, fontSize: 10 };

  return (
    <Card>
      <Text style={[styles.title, { color: colors.text }]}>Daily spending (this month)</Text>
      <LineChart
        data={points}
        curved
        color={colors.expense}
        thickness={2}
        hideDataPoints
        maxValue={maxValue}
        noOfSections={3}
        spacing={spacing}
        initialSpacing={8}
        width={width}
        height={150}
        yAxisThickness={0}
        xAxisThickness={0}
        rulesColor={colors.chartGrid}
        yAxisTextStyle={axisText}
        xAxisLabelTextStyle={axisText}
        isAnimated
        disableScroll
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
});
