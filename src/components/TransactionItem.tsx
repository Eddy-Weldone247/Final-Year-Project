import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getCategoryMeta } from '@/constants/categories';
import { useTheme } from '@/hooks/useTheme';
import type { Transaction } from '@/types/transaction';
import { formatCurrency, formatDate } from '@/utils/formatCurrency';

interface TransactionItemProps {
  transaction: Transaction;
  onPress?: () => void;
}

export function TransactionItem({ transaction, onPress }: TransactionItemProps) {
  const { colors } = useTheme();
  const meta = getCategoryMeta(transaction.category);
  const isIncome = transaction.type === 'INCOME';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: colors.card },
        pressed ? styles.pressed : null,
      ]}
    >
      <View style={[styles.iconCircle, { backgroundColor: `${meta.color}22` }]}>
        <Text style={styles.icon}>{meta.icon}</Text>
      </View>
      <View style={styles.middle}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {transaction.note || meta.label}
        </Text>
        <Text style={[styles.sub, { color: colors.textMuted }]}>
          {meta.label} · {formatDate(transaction.date)}
        </Text>
      </View>
      <Text style={[styles.amount, { color: isIncome ? colors.income : colors.expense }]}>
        {isIncome ? '+' : '-'}
        {formatCurrency(transaction.amount)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
    padding: 12,
  },
  pressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  iconCircle: {
    alignItems: 'center',
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  icon: { fontSize: 20 },
  middle: { flex: 1 },
  title: { fontSize: 15, fontWeight: '600' },
  sub: { fontSize: 13, marginTop: 2 },
  amount: { fontSize: 15, fontWeight: '700' },
});
