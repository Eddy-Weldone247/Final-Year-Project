import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CATEGORIES } from '@/constants/categories';
import { useTheme } from '@/hooks/useTheme';
import type { Category, TransactionType } from '@/types/transaction';

import { Button } from './Button';
import { TextField } from './TextField';

export interface TransactionFormPayload {
  type: TransactionType;
  amount: number;
  category: Category;
  note?: string;
}

interface TransactionFormProps {
  initial?: { type?: TransactionType; amount?: number; category?: Category; note?: string | null };
  submitLabel: string;
  submitting?: boolean;
  onSubmit: (payload: TransactionFormPayload) => void;
}

export function TransactionForm({
  initial,
  submitLabel,
  submitting = false,
  onSubmit,
}: TransactionFormProps) {
  const { colors } = useTheme();
  const [type, setType] = useState<TransactionType>(initial?.type ?? 'EXPENSE');
  const [amount, setAmount] = useState(initial?.amount != null ? String(initial.amount) : '');
  const [category, setCategory] = useState<Category>(initial?.category ?? 'FOOD');
  const [note, setNote] = useState(initial?.note ?? '');

  const numericAmount = Number(amount);
  const amountValid = amount.length > 0 && Number.isFinite(numericAmount) && numericAmount > 0;

  const handleSubmit = () => {
    onSubmit({
      type,
      amount: numericAmount,
      category,
      note: note.trim() ? note.trim() : undefined,
    });
  };

  return (
    <View style={styles.container}>
      <View style={[styles.typeRow, { backgroundColor: colors.cardAlt }]}>
        {(['EXPENSE', 'INCOME'] as TransactionType[]).map((t) => {
          const active = type === t;
          const activeBg = t === 'INCOME' ? colors.income : colors.expense;
          return (
            <Pressable
              key={t}
              onPress={() => setType(t)}
              style={[styles.typeBtn, active ? { backgroundColor: activeBg } : null]}
            >
              <Text
                style={[
                  styles.typeText,
                  { color: active ? colors.onPrimary : colors.textSecondary },
                ]}
              >
                {t === 'INCOME' ? 'Income' : 'Expense'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <TextField
        label="Amount"
        value={amount}
        onChangeText={setAmount}
        placeholder="0.00"
        keyboardType="decimal-pad"
      />

      <View>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Category</Text>
        <View style={styles.catGrid}>
          {CATEGORIES.map((c) => {
            const active = category === c.value;
            return (
              <Pressable
                key={c.value}
                onPress={() => setCategory(c.value)}
                style={[
                  styles.chip,
                  { backgroundColor: colors.card, borderColor: colors.inputBorder },
                  active
                    ? { backgroundColor: colors.primaryTint, borderColor: colors.primary }
                    : null,
                ]}
              >
                <Text style={styles.chipIcon}>{c.icon}</Text>
                <Text
                  style={[
                    styles.chipLabel,
                    { color: active ? colors.primaryStrong : colors.textSecondary },
                    active ? styles.chipLabelActive : null,
                  ]}
                >
                  {c.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <TextField
        label="Note (optional)"
        value={note}
        onChangeText={setNote}
        placeholder="e.g. Lunch with friends"
      />

      <Button
        title={submitLabel}
        onPress={handleSubmit}
        loading={submitting}
        disabled={!amountValid}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16 },
  typeRow: { borderRadius: 10, flexDirection: 'row', padding: 4 },
  typeBtn: { alignItems: 'center', borderRadius: 8, flex: 1, paddingVertical: 10 },
  typeText: { fontSize: 15, fontWeight: '600' },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 8 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipIcon: { fontSize: 16 },
  chipLabel: { fontSize: 14 },
  chipLabelActive: { fontWeight: '600' },
});
