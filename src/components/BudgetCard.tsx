import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import type { BudgetProgress } from '@/types/budget';
import { formatCurrency } from '@/utils/formatCurrency';

import { ProgressBar, statusColor } from './ProgressBar';

interface BudgetCardProps {
  label: string;
  icon?: string;
  budget?: BudgetProgress | null;
  onPress: () => void;
}

/** Summary card for one budget (overall or category), or a "set budget" prompt. */
export function BudgetCard({ label, icon, budget, onPress }: BudgetCardProps) {
  const { colors, isDark } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.card, shadowOpacity: isDark ? 0.35 : 0.06 },
        pressed ? styles.pressed : null,
      ]}
    >
      <View style={styles.headerRow}>
        <Text style={[styles.label, { color: colors.text }]}>
          {icon ? `${icon}  ` : ''}
          {label}
        </Text>
        {budget ? (
          <Text style={[styles.percent, { color: statusColor(budget.status, colors) }]}>
            {budget.percent}%
          </Text>
        ) : (
          <Text style={[styles.set, { color: colors.primary }]}>Set budget ›</Text>
        )}
      </View>

      {budget ? (
        <>
          <Text style={[styles.amounts, { color: colors.text }]}>
            {formatCurrency(budget.spent)}{' '}
            <Text style={[styles.muted, { color: colors.textMuted }]}>
              of {formatCurrency(budget.amount)}
            </Text>
          </Text>
          <ProgressBar percent={budget.percent} status={budget.status} />
          <Text
            style={[
              styles.remaining,
              { color: budget.remaining < 0 ? colors.expense : colors.textMuted },
              budget.remaining < 0 ? styles.over : null,
            ]}
          >
            {budget.remaining >= 0
              ? `${formatCurrency(budget.remaining)} left`
              : `${formatCurrency(Math.abs(budget.remaining))} over budget`}
          </Text>
        </>
      ) : (
        <Text style={[styles.muted, { color: colors.textMuted }]}>
          Tap to set a monthly budget.
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    elevation: 2,
    gap: 8,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
  },
  pressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  headerRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontSize: 16, fontWeight: '700' },
  percent: { fontSize: 16, fontWeight: '700' },
  set: { fontSize: 14, fontWeight: '600' },
  amounts: { fontSize: 15, fontWeight: '600' },
  muted: { fontSize: 13, fontWeight: '400' },
  remaining: { fontSize: 13 },
  over: { fontWeight: '600' },
});
