import { StyleSheet, Text, View } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';

import { Card } from '@/components/Card';
import { getCategoryMeta } from '@/constants/categories';
import { useTheme } from '@/hooks/useTheme';
import type { CategoryTotal } from '@/types/stats';
import { formatCurrency } from '@/utils/formatCurrency';

export function ExpensePieCard({ data }: { data: CategoryTotal[] }) {
  const { colors } = useTheme();
  const total = data.reduce((sum, c) => sum + c.total, 0);
  const pieData = data.map((c) => ({ value: c.total, color: getCategoryMeta(c.category).color }));

  return (
    <Card>
      <Text style={[styles.title, { color: colors.text }]}>Expenses by category</Text>
      {total === 0 ? (
        <Text style={[styles.empty, { color: colors.textMuted }]}>No expenses recorded yet.</Text>
      ) : (
        <View style={styles.body}>
          <View style={styles.pieWrap}>
            <PieChart
              data={pieData}
              donut
              radius={80}
              innerRadius={50}
              innerCircleColor={colors.card}
              isAnimated
              animationDuration={700}
              centerLabelComponent={() => (
                <View style={styles.center}>
                  <Text style={[styles.centerLabel, { color: colors.textMuted }]}>Total</Text>
                  <Text style={[styles.centerValue, { color: colors.text }]}>
                    {formatCurrency(total)}
                  </Text>
                </View>
              )}
            />
          </View>
          <View style={styles.legend}>
            {data.map((c) => {
              const meta = getCategoryMeta(c.category);
              const pct = Math.round((c.total / total) * 100);
              return (
                <View key={c.category} style={styles.legendRow}>
                  <View style={[styles.dot, { backgroundColor: meta.color }]} />
                  <Text style={[styles.legendLabel, { color: colors.text }]} numberOfLines={1}>
                    {meta.icon} {meta.label}
                  </Text>
                  <Text style={[styles.legendValue, { color: colors.textMuted }]}>
                    {formatCurrency(c.total)} · {pct}%
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  empty: { fontSize: 14, paddingVertical: 16, textAlign: 'center' },
  body: { gap: 16 },
  pieWrap: { alignItems: 'center' },
  center: { alignItems: 'center' },
  centerLabel: { fontSize: 12 },
  centerValue: { fontSize: 16, fontWeight: '700' },
  legend: { gap: 8 },
  legendRow: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  dot: { borderRadius: 5, height: 10, width: 10 },
  legendLabel: { flex: 1, fontSize: 14, fontWeight: '500' },
  legendValue: { fontSize: 13 },
});
