import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { Card } from '@/components/Card';
import { getCategoryMeta } from '@/constants/categories';
import { useTheme } from '@/hooks/useTheme';
import type { CategoryTotal } from '@/types/stats';
import { formatCurrency } from '@/utils/formatCurrency';

function CategoryRow({
  item,
  total,
  index,
}: {
  item: CategoryTotal;
  total: number;
  index: number;
}) {
  const { colors } = useTheme();
  const meta = getCategoryMeta(item.category);
  const pct = total > 0 ? item.total / total : 0;

  const w = useSharedValue(0);
  useEffect(() => {
    w.value = withDelay(
      index * 90,
      withTiming(pct, { duration: 700, easing: Easing.out(Easing.cubic) }),
    );
  }, [pct, index, w]);
  const fillStyle = useAnimatedStyle(() => ({ width: `${w.value * 100}%` }));

  return (
    <View style={styles.row}>
      <View style={[styles.icon, { backgroundColor: `${meta.color}22` }]}>
        <Text style={styles.emoji}>{meta.icon}</Text>
      </View>
      <View style={styles.mid}>
        <View style={styles.labelRow}>
          <Text style={[styles.label, { color: colors.text }]}>{meta.label}</Text>
          <Text style={[styles.amount, { color: colors.textMuted }]}>
            {formatCurrency(item.total)} · {Math.round(pct * 100)}%
          </Text>
        </View>
        <View style={[styles.track, { backgroundColor: colors.cardAlt }]}>
          <Animated.View style={[styles.fill, { backgroundColor: meta.color }, fillStyle]} />
        </View>
      </View>
    </View>
  );
}

/** Top expense categories with animated proportion bars. */
export function CategoryBreakdown({ data }: { data: CategoryTotal[] }) {
  const { colors } = useTheme();
  const top = data.slice(0, 5);
  const total = data.reduce((sum, c) => sum + c.total, 0);

  return (
    <Card>
      <Text style={[styles.title, { color: colors.text }]}>Expense categories</Text>
      {top.length === 0 ? (
        <Text style={[styles.empty, { color: colors.textMuted }]}>
          No expenses yet this period.
        </Text>
      ) : (
        <View style={styles.list}>
          {top.map((item, i) => (
            <CategoryRow key={item.category} item={item} total={total} index={i} />
          ))}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 16, fontWeight: '700', marginBottom: 14 },
  empty: { fontSize: 14, paddingVertical: 12, textAlign: 'center' },
  list: { gap: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 18 },
  mid: { flex: 1, gap: 7 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 14, fontWeight: '600' },
  amount: { fontSize: 13 },
  track: { height: 8, borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
});
