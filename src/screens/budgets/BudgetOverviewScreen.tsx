import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BudgetCard } from '@/components/BudgetCard';
import { FadeInView } from '@/components/FadeInView';
import { statusColor } from '@/components/ProgressBar';
import { CATEGORIES, getCategoryMeta } from '@/constants/categories';
import { useTheme } from '@/hooks/useTheme';
import { useBudgets } from '@/hooks/useBudgets';
import type { BudgetsStackParamList } from '@/navigation/types';
import type { BudgetProgress } from '@/types/budget';
import type { Category } from '@/types/transaction';
import { formatCurrency } from '@/utils/formatCurrency';
import { currentMonth, formatMonth, shiftMonth } from '@/utils/month';

type Props = NativeStackScreenProps<BudgetsStackParamList, 'BudgetOverview'>;

const BUDGET_CATEGORY_VALUES: Category[] = [
  'FOOD',
  'TRANSPORT',
  'SHOPPING',
  'ENTERTAINMENT',
  'UTILITIES',
];
const BUDGET_CATEGORIES = CATEGORIES.filter((c) => BUDGET_CATEGORY_VALUES.includes(c.value));

export function BudgetOverviewScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const [month, setMonth] = useState(currentMonth());
  const { data, isRefetching, refetch } = useBudgets(month);

  const overall = data?.overall ?? null;
  const categoryBudgets = data?.categories ?? [];
  const byCategory = new Map(categoryBudgets.map((b) => [b.category, b]));

  const alerts = [overall, ...categoryBudgets].filter(
    (b): b is BudgetProgress => !!b && b.status !== 'ok',
  );

  const openForm = (scope: 'overall' | Category, label: string, budget?: BudgetProgress | null) => {
    navigation.navigate('BudgetForm', {
      scope,
      month,
      label,
      budgetId: budget?.id,
      currentAmount: budget?.amount,
    });
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
      >
        <FadeInView style={styles.inner}>
          <View style={styles.monthRow}>
            <Pressable onPress={() => setMonth(shiftMonth(month, -1))} hitSlop={12}>
              <Text style={[styles.arrow, { color: colors.primary }]}>‹</Text>
            </Pressable>
            <Text style={[styles.month, { color: colors.text }]}>{formatMonth(month)}</Text>
            <Pressable onPress={() => setMonth(shiftMonth(month, 1))} hitSlop={12}>
              <Text style={[styles.arrow, { color: colors.primary }]}>›</Text>
            </Pressable>
          </View>

          {alerts.length > 0 ? (
            <View
              style={[
                styles.alertBox,
                { backgroundColor: colors.card, borderColor: colors.warning },
              ]}
            >
              {alerts.map((b) => {
                const label = b.category ? getCategoryMeta(b.category).label : 'Overall';
                const exceeded = b.status === 'exceeded';
                return (
                  <Text
                    key={b.id}
                    style={[styles.alertText, { color: statusColor(b.status, colors) }]}
                  >
                    {exceeded ? '🚫' : '⚠️'} {label}{' '}
                    {exceeded ? 'is over budget' : `reached ${b.percent}%`} (
                    {formatCurrency(b.spent)} / {formatCurrency(b.amount)})
                  </Text>
                );
              })}
            </View>
          ) : null}

          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Overall</Text>
          <BudgetCard
            label="Monthly budget"
            budget={overall}
            onPress={() => openForm('overall', 'Overall budget', overall)}
          />

          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>Categories</Text>
          {BUDGET_CATEGORIES.map((meta) => (
            <BudgetCard
              key={meta.value}
              label={meta.label}
              icon={meta.icon}
              budget={byCategory.get(meta.value)}
              onPress={() => openForm(meta.value, meta.label, byCategory.get(meta.value))}
            />
          ))}
        </FadeInView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 16 },
  inner: { gap: 10 },
  monthRow: { alignItems: 'center', flexDirection: 'row', gap: 16, justifyContent: 'center' },
  arrow: { fontSize: 28, fontWeight: '700' },
  month: { fontSize: 18, fontWeight: '700', minWidth: 150, textAlign: 'center' },
  alertBox: {
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
    padding: 14,
  },
  alertText: { fontSize: 13, fontWeight: '600' },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
    textTransform: 'uppercase',
  },
});
