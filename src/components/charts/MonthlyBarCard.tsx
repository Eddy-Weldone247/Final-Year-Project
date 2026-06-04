import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';

import { Card } from '@/components/Card';
import { useTheme } from '@/hooks/useTheme';
import type { MonthlyTotal } from '@/types/stats';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function monthShort(month: string): string {
  return MONTHS[Number(month.slice(5, 7)) - 1] ?? '';
}

function niceMax(value: number): number {
  if (value <= 0) return 100;
  const pow = Math.pow(10, Math.floor(Math.log10(value)));
  return Math.ceil(value / pow) * pow;
}

export function MonthlyBarCard({ data }: { data: MonthlyTotal[] }) {
  const { colors } = useTheme();
  const width = Dimensions.get('window').width - 32 - 32;

  const barData = data.flatMap((m) => [
    {
      value: m.income,
      frontColor: colors.income,
      spacing: 4,
      label: monthShort(m.month),
      labelWidth: 34,
      labelTextStyle: { color: colors.textMuted, fontSize: 11 },
    },
    { value: m.expense, frontColor: colors.expense },
  ]);

  const maxValue = niceMax(Math.max(1, ...data.flatMap((m) => [m.income, m.expense])));
  const axisText = { color: colors.textMuted, fontSize: 10 };

  return (
    <Card>
      <Text style={[styles.title, { color: colors.text }]}>Monthly income vs expense</Text>
      <View style={styles.legendRow}>
        <Legend color={colors.income} label="Income" textColor={colors.textMuted} />
        <Legend color={colors.expense} label="Expense" textColor={colors.textMuted} />
      </View>
      <BarChart
        data={barData}
        barWidth={12}
        spacing={22}
        initialSpacing={12}
        roundedTop
        noOfSections={3}
        maxValue={maxValue}
        width={width}
        height={170}
        yAxisThickness={0}
        xAxisThickness={0}
        rulesColor={colors.chartGrid}
        yAxisTextStyle={axisText}
        isAnimated
        disableScroll
      />
    </Card>
  );
}

function Legend({ color, label, textColor }: { color: string; label: string; textColor: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.legendText, { color: textColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 16, fontWeight: '700' },
  legendRow: { flexDirection: 'row', gap: 16, marginBottom: 8, marginTop: 4 },
  legendItem: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  dot: { borderRadius: 5, height: 10, width: 10 },
  legendText: { fontSize: 12 },
});
