import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

import type { AuthPalette } from '@/theme/authTheme';
import { fontFamily } from '@/theme/typography';
import type { MonthlyTotal } from '@/types/stats';
import { CURRENCY_GLYPH, formatCurrency } from '@/utils/formatCurrency';

import { niceMax, shortMonth } from './chartUtils';

function LegendItem({ color, label, c }: { color: string; label: string; c: AuthPalette }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.legendText, { color: c.textMuted }]}>{label}</Text>
    </View>
  );
}

/** Income vs expense over the last 6 months — two lines with a touch tooltip. */
export function IncomeExpenseChart({ monthly, c }: { monthly: MonthlyTotal[]; c: AuthPalette }) {
  const { width } = useWindowDimensions();
  const chartWidth = width - 40 - 48; // screen padding + card padding

  const income = monthly.map((m) => ({ value: m.income, label: shortMonth(m.month) }));
  const expense = monthly.map((m) => ({ value: m.expense, label: shortMonth(m.month) }));
  const maxValue = niceMax(Math.max(1, ...monthly.flatMap((m) => [m.income, m.expense])));
  const spacing = Math.max(40, Math.floor((chartWidth - 32) / Math.max(monthly.length, 1)));
  const axisText = { color: c.textMuted, fontSize: 10, fontFamily: fontFamily.medium };

  return (
    <View>
      <LineChart
        data={income}
        data2={expense}
        color1={c.success}
        color2={c.danger}
        thickness={2.5}
        curved
        hideDataPoints
        maxValue={maxValue}
        noOfSections={3}
        spacing={spacing}
        initialSpacing={16}
        endSpacing={8}
        width={chartWidth}
        height={170}
        yAxisThickness={0}
        xAxisThickness={0}
        rulesColor={c.glassBorder}
        rulesType="dashed"
        yAxisTextStyle={axisText}
        xAxisLabelTextStyle={axisText}
        yAxisLabelPrefix={CURRENCY_GLYPH}
        isAnimated
        animateOnDataChange
        disableScroll
        pointerConfig={{
          pointerStripColor: c.textMuted,
          pointerStripWidth: 2,
          pointerColor: c.primary,
          radius: 5,
          pointerLabelWidth: 140,
          pointerLabelHeight: 64,
          activatePointersOnLongPress: false,
          autoAdjustPointerLabelPosition: true,
          pointerLabelComponent: (items: { value: number }[]) => (
            <View
              style={[styles.tooltip, { backgroundColor: c.glassBg, borderColor: c.glassBorder }]}
            >
              <Text style={[styles.tipRow, { color: c.success }]}>
                Income {formatCurrency(items?.[0]?.value ?? 0)}
              </Text>
              <Text style={[styles.tipRow, { color: c.danger }]}>
                Expense {formatCurrency(items?.[1]?.value ?? 0)}
              </Text>
            </View>
          ),
        }}
      />
      <View style={styles.legend}>
        <LegendItem color={c.success} label="Income" c={c} />
        <LegendItem color={c.danger} label="Expense" c={c} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  legend: { flexDirection: 'row', gap: 18, marginTop: 12, justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 13, fontFamily: fontFamily.medium },
  tooltip: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8, gap: 2 },
  tipRow: { fontSize: 12, fontFamily: fontFamily.semibold },
});
