import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';

import type { AuthPalette } from '@/theme/authTheme';
import { fontFamily } from '@/theme/typography';
import type { MonthlyTotal } from '@/types/stats';
import { formatCurrency } from '@/utils/formatCurrency';

import { niceMax, shortMonth } from './chartUtils';

/** Spending per month — bars with a tap-to-reveal tooltip (income + expense). */
export function MonthlyBarChart({ monthly, c }: { monthly: MonthlyTotal[]; c: AuthPalette }) {
  const { width } = useWindowDimensions();
  const chartWidth = width - 40 - 48;

  const data = monthly.map((m) => ({
    value: m.expense,
    label: shortMonth(m.month),
    frontColor: c.primary,
  }));
  const maxValue = niceMax(Math.max(1, ...monthly.map((m) => m.expense)));
  const count = Math.max(monthly.length, 1);
  const barWidth = 20;
  const spacing = Math.max(12, (chartWidth - barWidth * count - 24) / count);
  const axisText = { color: c.textMuted, fontSize: 10, fontFamily: fontFamily.medium };

  return (
    <BarChart
      data={data}
      barWidth={barWidth}
      spacing={spacing}
      initialSpacing={16}
      roundedTop
      barBorderRadius={6}
      frontColor={c.primary}
      maxValue={maxValue}
      noOfSections={3}
      width={chartWidth}
      height={170}
      yAxisThickness={0}
      xAxisThickness={0}
      rulesColor={c.glassBorder}
      rulesType="dashed"
      yAxisTextStyle={axisText}
      xAxisLabelTextStyle={axisText}
      yAxisLabelPrefix="$"
      isAnimated
      disableScroll
      renderTooltip={(_item: unknown, index: number) => {
        const m = monthly[index];
        if (!m) return null;
        return (
          <View
            style={[styles.tooltip, { backgroundColor: c.glassBg, borderColor: c.glassBorder }]}
          >
            <Text style={[styles.tipMonth, { color: c.text }]}>{shortMonth(m.month)}</Text>
            <Text style={[styles.tipRow, { color: c.danger }]}>
              Spent {formatCurrency(m.expense)}
            </Text>
            <Text style={[styles.tipRow, { color: c.success }]}>
              Earned {formatCurrency(m.income)}
            </Text>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  tooltip: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 2,
    marginBottom: 8,
    minWidth: 120,
  },
  tipMonth: { fontSize: 13, fontFamily: fontFamily.bold },
  tipRow: { fontSize: 12, fontFamily: fontFamily.semibold },
});
