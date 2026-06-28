import { Ionicons } from '@expo/vector-icons';
import { memo, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { PieChart } from 'react-native-gifted-charts';

import { PressableScale } from '@/components/animations/PressableScale';
import { Card } from '@/components/Card';
import { getCategoryMeta } from '@/constants/categories';
import { useTheme } from '@/hooks/useTheme';
import type { CategoryTotal } from '@/types/stats';
import type { Category } from '@/types/transaction';
import { formatCurrency } from '@/utils/formatCurrency';

interface ExpensePieCardProps {
  data: CategoryTotal[];
  /** Render without the built-in `Card`/title so a parent can supply the container. */
  embedded?: boolean;
  /** When set, legend rows become pressable (adds touch feedback). */
  onCategoryPress?: (category: Category) => void;
}

function LegendRow({
  item,
  total,
  embedded,
  index,
  onPress,
}: {
  item: CategoryTotal;
  total: number;
  embedded: boolean;
  index: number;
  onPress?: (category: Category) => void;
}) {
  const { colors } = useTheme();
  const meta = getCategoryMeta(item.category);
  const pct = Math.round((item.total / total) * 100);

  const inner = (
    <View style={styles.legendRow}>
      <View style={styles.legendIcon}>
        <Ionicons name={meta.ionicon} size={18} color={meta.color} />
      </View>
      <Text style={[styles.legendLabel, { color: colors.text }]} numberOfLines={1}>
        {meta.label}
      </Text>
      <Text style={[styles.legendValue, { color: colors.textMuted }]}>
        {formatCurrency(item.total)} · {pct}%
      </Text>
    </View>
  );

  const row = onPress ? (
    <PressableScale
      onPress={() => onPress(item.category)}
      scaleTo={0.97}
      accessibilityLabel={`${meta.label}, ${formatCurrency(item.total)}, ${pct} percent`}
    >
      {inner}
    </PressableScale>
  ) : (
    inner
  );

  // Legend fade-in (staggered) only in the embedded dashboard context.
  return embedded ? (
    <Animated.View entering={FadeIn.duration(280).delay(120 + index * 60)}>{row}</Animated.View>
  ) : (
    row
  );
}

function ExpensePieCardBase({ data, embedded = false, onCategoryPress }: ExpensePieCardProps) {
  const { colors } = useTheme();

  const { total, pieData } = useMemo(
    () => ({
      total: data.reduce((sum, c) => sum + c.total, 0),
      pieData: data.map((c) => ({ value: c.total, color: getCategoryMeta(c.category).color })),
    }),
    [data],
  );

  const content =
    total === 0 ? (
      <Text style={[styles.empty, { color: colors.textMuted }]}>No expenses recorded yet.</Text>
    ) : (
      <View style={styles.body}>
        <View style={styles.pieWrap}>
          <PieChart
            data={pieData}
            donut
            radius={80}
            innerRadius={50}
            innerCircleColor={embedded ? 'transparent' : colors.card}
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
          {data.map((c, i) => (
            <LegendRow
              key={c.category}
              item={c}
              total={total}
              embedded={embedded}
              index={i}
              onPress={onCategoryPress}
            />
          ))}
        </View>
      </View>
    );

  if (embedded) {
    return content;
  }

  return (
    <Card>
      <Text style={[styles.title, { color: colors.text }]}>Expenses by category</Text>
      {content}
    </Card>
  );
}

export const ExpensePieCard = memo(ExpensePieCardBase);

const styles = StyleSheet.create({
  title: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  empty: { fontSize: 14, paddingVertical: 16, textAlign: 'center' },
  body: { gap: 16 },
  pieWrap: { alignItems: 'center' },
  center: { alignItems: 'center' },
  centerLabel: { fontSize: 12 },
  centerValue: { fontSize: 16, fontWeight: '700' },
  legend: { gap: 8 },
  legendRow: { alignItems: 'center', flexDirection: 'row', gap: 8, paddingVertical: 2 },
  legendIcon: { width: 22, alignItems: 'center' },
  legendLabel: { flex: 1, fontSize: 14, fontWeight: '500' },
  legendValue: { fontSize: 13 },
});
