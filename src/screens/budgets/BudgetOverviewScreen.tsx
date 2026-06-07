import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedBackground } from '@/components/animations/AnimatedBackground';
import { PressableScale } from '@/components/animations/PressableScale';
import { BudgetCategoryCard } from '@/components/budgets/BudgetCategoryCard';
import { budgetStatusColor, budgetStatusLabel } from '@/components/budgets/budgetStatus';
import { Celebration } from '@/components/budgets/Celebration';
import { CircularProgress } from '@/components/budgets/CircularProgress';
import { GlassCard } from '@/components/cards/GlassCard';
import { Skeleton } from '@/components/dashboard/Skeleton';
import { ChevronLeftIcon, PlusIcon } from '@/components/icons';
import { CATEGORIES } from '@/constants/categories';
import { useBudgets } from '@/hooks/useBudgets';
import type { BudgetsStackParamList } from '@/navigation/types';
import { type AuthPalette, useAuthTheme } from '@/theme/authTheme';
import { fontFamily } from '@/theme/typography';
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

function StatusPill({ status, c }: { status: BudgetProgress['status']; c: AuthPalette }) {
  const color = budgetStatusColor(status, c);
  return (
    <View style={[styles.pill, { backgroundColor: `${color}26` }]}>
      <Text style={[styles.pillText, { color }]}>{budgetStatusLabel(status)}</Text>
    </View>
  );
}

function AlertBanner({
  budget,
  label,
  c,
}: {
  budget: BudgetProgress;
  label: string;
  c: AuthPalette;
}) {
  const color = budgetStatusColor(budget.status, c);
  const exceeded = budget.status === 'exceeded';
  return (
    <Animated.View
      entering={FadeIn.duration(280)}
      style={[styles.alert, { backgroundColor: c.glassBg, borderColor: color }]}
    >
      <Text style={styles.alertIcon}>{exceeded ? '🚫' : '⚠️'}</Text>
      <Text style={[styles.alertText, { color: c.text }]}>
        <Text style={{ color }}>{label}</Text>{' '}
        {exceeded ? 'is over budget' : `reached ${budget.percent}%`} —{' '}
        {formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}
      </Text>
    </Animated.View>
  );
}

export function BudgetOverviewScreen({ navigation }: Props) {
  const { c } = useAuthTheme();
  const [month, setMonth] = useState(currentMonth());
  const { data, isLoading, isRefetching, refetch } = useBudgets(month);

  const overall = data?.overall ?? null;
  const categoryBudgets = data?.categories ?? [];
  const byCategory = new Map(categoryBudgets.map((b) => [b.category, b]));
  const alerts = [overall, ...categoryBudgets].filter(
    (b): b is BudgetProgress => !!b && b.status !== 'ok',
  );
  const healthy = !!overall && overall.status === 'ok';

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
    <View style={[styles.root, { backgroundColor: c.gradient[0] }]}>
      <AnimatedBackground />
      <SafeAreaView style={styles.fill} edges={['top']}>
        {/* Header + month switcher */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: c.text }]}>Budgets</Text>
          <View style={styles.monthRow}>
            <MonthArrow direction="left" c={c} onPress={() => setMonth(shiftMonth(month, -1))} />
            <Text style={[styles.month, { color: c.text }]}>{formatMonth(month)}</Text>
            <MonthArrow direction="right" c={c} onPress={() => setMonth(shiftMonth(month, 1))} />
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={c.primary}
              colors={[c.primary]}
            />
          }
        >
          {isLoading ? (
            <GlassCard>
              <View style={styles.loadingRing}>
                <Skeleton width={168} height={168} radius={84} />
              </View>
            </GlassCard>
          ) : (
            <>
              {/* Monthly budget card */}
              <GlassCard delay={60}>
                {overall ? (
                  <View style={styles.overall}>
                    <View style={styles.ringWrap}>
                      <CircularProgress
                        percent={overall.percent}
                        color={budgetStatusColor(overall.status, c)}
                        track={c.inputBorder}
                      >
                        <Text style={[styles.ringPct, { color: c.text }]}>{overall.percent}%</Text>
                        <Text style={[styles.ringCaption, { color: c.textMuted }]}>of budget</Text>
                      </CircularProgress>
                      <Celebration play={healthy} />
                    </View>

                    <StatusPill status={overall.status} c={c} />
                    <Text style={[styles.overallAmounts, { color: c.text }]}>
                      {formatCurrency(overall.spent)}{' '}
                      <Text style={{ color: c.textMuted }}>
                        of {formatCurrency(overall.amount)}
                      </Text>
                    </Text>
                    <Text
                      style={[
                        styles.overallRemaining,
                        { color: overall.remaining < 0 ? c.danger : c.textMuted },
                      ]}
                    >
                      {overall.remaining >= 0
                        ? `${formatCurrency(overall.remaining)} left this month`
                        : `${formatCurrency(Math.abs(overall.remaining))} over budget`}
                    </Text>
                    <PressableScale
                      onPress={() => openForm('overall', 'Overall budget', overall)}
                      style={[styles.editBtn, { borderColor: c.glassBorder }]}
                    >
                      <Text style={[styles.editText, { color: c.primary }]}>
                        Edit monthly budget
                      </Text>
                    </PressableScale>
                  </View>
                ) : (
                  <PressableScale
                    onPress={() => openForm('overall', 'Overall budget')}
                    style={styles.setOverall}
                  >
                    <View
                      style={[
                        styles.setIcon,
                        { backgroundColor: `${c.primary}22`, borderColor: c.glassBorder },
                      ]}
                    >
                      <PlusIcon size={26} color={c.primary} />
                    </View>
                    <Text style={[styles.setTitle, { color: c.text }]}>Set a monthly budget</Text>
                    <Text style={[styles.setSub, { color: c.textMuted }]}>
                      Track your overall spending against a monthly limit.
                    </Text>
                  </PressableScale>
                )}
              </GlassCard>

              {/* Alerts */}
              {alerts.map((b) => (
                <AlertBanner
                  key={b.id}
                  budget={b}
                  label={
                    b.category
                      ? (CATEGORIES.find((x) => x.value === b.category)?.label ?? 'Category')
                      : 'Overall'
                  }
                  c={c}
                />
              ))}

              {/* Category budgets */}
              <Animated.Text
                entering={FadeInDown.duration(400).delay(120)}
                style={[styles.section, { color: c.textMuted }]}
              >
                CATEGORY BUDGETS
              </Animated.Text>
              {BUDGET_CATEGORIES.map((meta, i) => (
                <Animated.View
                  key={meta.value}
                  entering={FadeInDown.duration(380).delay(140 + i * 60)}
                >
                  <BudgetCategoryCard
                    meta={meta}
                    index={i}
                    budget={byCategory.get(meta.value)}
                    onPress={() => openForm(meta.value, meta.label, byCategory.get(meta.value))}
                  />
                </Animated.View>
              ))}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function MonthArrow({
  direction,
  c,
  onPress,
}: {
  direction: 'left' | 'right';
  c: AuthPalette;
  onPress: () => void;
}) {
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.9}
      accessibilityLabel={direction === 'left' ? 'Previous month' : 'Next month'}
      style={[styles.arrow, { backgroundColor: c.glassBg, borderColor: c.glassBorder }]}
    >
      <View style={direction === 'right' ? styles.flip : undefined}>
        <ChevronLeftIcon size={20} color={c.text} />
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  fill: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 8, gap: 12 },
  title: { fontSize: 28, fontFamily: fontFamily.bold, letterSpacing: -0.4 },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16 },
  arrow: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flip: { transform: [{ scaleX: -1 }] },
  month: { fontSize: 17, fontFamily: fontFamily.semibold, minWidth: 150, textAlign: 'center' },
  content: { padding: 20, paddingTop: 4, paddingBottom: 32, gap: 12 },
  overall: { alignItems: 'center', gap: 12 },
  ringWrap: { width: 168, height: 168, alignItems: 'center', justifyContent: 'center' },
  ringPct: { fontSize: 34, fontFamily: fontFamily.extrabold },
  ringCaption: { fontSize: 13, fontFamily: fontFamily.medium },
  pill: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  pillText: { fontSize: 12, fontFamily: fontFamily.bold, letterSpacing: 0.3 },
  overallAmounts: { fontSize: 18, fontFamily: fontFamily.bold },
  overallRemaining: { fontSize: 14, fontFamily: fontFamily.medium },
  editBtn: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 4,
  },
  editText: { fontSize: 14, fontFamily: fontFamily.semibold },
  setOverall: { alignItems: 'center', gap: 8, paddingVertical: 12 },
  setIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  setTitle: { fontSize: 17, fontFamily: fontFamily.bold },
  setSub: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
    maxWidth: 260,
  },
  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  alertIcon: { fontSize: 16 },
  alertText: { flex: 1, fontSize: 13, lineHeight: 18, fontFamily: fontFamily.medium },
  section: {
    fontSize: 12,
    fontFamily: fontFamily.bold,
    letterSpacing: 1,
    marginTop: 8,
    marginBottom: 2,
  },
  loadingRing: { alignItems: 'center', paddingVertical: 8 },
});
