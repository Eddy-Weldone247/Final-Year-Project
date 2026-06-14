import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Alert, Modal, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { PressableScale } from '@/components/animations/PressableScale';
import { SuccessCheck } from '@/components/animations/SuccessCheck';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { budgetStatusColor, budgetStatusLabel } from '@/components/budgets/budgetStatus';
import { CircularProgress } from '@/components/budgets/CircularProgress';
import { GradientButton } from '@/components/buttons/GradientButton';
import { GlassCard } from '@/components/cards/GlassCard';
import { SparkleIcon, TargetIcon, TrashIcon } from '@/components/icons';
import { FloatingLabelInput } from '@/components/inputs/FloatingLabelInput';
import { useBudgets, useCreateBudget, useDeleteBudget, useUpdateBudget } from '@/hooks/useBudgets';
import type { BudgetsStackParamList } from '@/navigation/types';
import { type AuthPalette, useAuthTheme } from '@/theme/authTheme';
import { radius, spacing } from '@/theme/spacing';
import { fontFamily } from '@/theme/typography';
import type { BudgetProgress } from '@/types/budget';
import { formatCurrency } from '@/utils/formatCurrency';
import { getErrorMessage } from '@/utils/getErrorMessage';
import { formatMonth } from '@/utils/month';

type Props = NativeStackScreenProps<BudgetsStackParamList, 'BudgetForm'>;

/** A labelled money figure used in the overview card's breakdown row. */
function StatBlock({
  label,
  value,
  color,
  c,
}: {
  label: string;
  value: string;
  color?: string;
  c: AuthPalette;
}) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color: color ?? c.text }]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={[styles.statLabel, { color: c.textMuted }]}>{label}</Text>
    </View>
  );
}

function StatusPill({ status, c }: { status: BudgetProgress['status']; c: AuthPalette }) {
  const color = budgetStatusColor(status, c);
  return (
    <View style={[styles.pill, { backgroundColor: `${color}26` }]}>
      <Text style={[styles.pillText, { color }]}>{budgetStatusLabel(status)}</Text>
    </View>
  );
}

/** AI-style budget insight derived from the live progress. */
function insightFor(budget: BudgetProgress, scopeNoun: string): string {
  const remaining = formatCurrency(Math.abs(budget.remaining));
  if (budget.status === 'exceeded') {
    return `You're ${remaining} over your ${scopeNoun} this month — worth easing off here.`;
  }
  if (budget.status === 'warning') {
    return `Only ${remaining} left in your ${scopeNoun}, and you're already at ${budget.percent}%.`;
  }
  return `Nice — you're on track with ${remaining} still available in your ${scopeNoun}.`;
}

export function BudgetFormScreen({ route, navigation }: Props) {
  const { c, isDark } = useAuthTheme();
  const { scope, month, label, budgetId, currentAmount } = route.params;

  const [amount, setAmount] = useState(currentAmount != null ? String(currentAmount) : '');
  const [done, setDone] = useState(false);

  const { data } = useBudgets(month);
  const budget =
    scope === 'overall'
      ? (data?.overall ?? null)
      : (data?.categories.find((b) => b.category === scope) ?? null);

  const create = useCreateBudget();
  const update = useUpdateBudget();
  const remove = useDeleteBudget();

  const isEditing = !!budgetId;
  const numeric = Number(amount);
  const hasInput = amount.trim().length > 0;
  const valid = hasInput && Number.isFinite(numeric) && numeric > 0;
  const error = hasInput && !valid ? 'Enter an amount greater than 0' : null;
  const submitting = create.isPending || update.isPending;

  const screenTitle = scope === 'overall' ? 'Monthly budget' : `${label} budget`;
  const scopeNoun = scope === 'overall' ? 'monthly budget' : `${label.toLowerCase()} budget`;

  const onError = (e: unknown) => Alert.alert('Could not save budget', getErrorMessage(e));

  const finish = () => {
    setDone(true);
    setTimeout(() => navigation.goBack(), 1000);
  };

  const handleSave = () => {
    if (!valid) return;
    if (isEditing) {
      update.mutate({ id: budgetId, payload: { amount: numeric } }, { onSuccess: finish, onError });
    } else {
      create.mutate(
        { month, category: scope === 'overall' ? null : scope, amount: numeric },
        { onSuccess: finish, onError },
      );
    }
  };

  const handleDelete = () => {
    if (!budgetId) return;
    Alert.alert('Delete budget', 'Remove this budget?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          remove.mutate(budgetId, {
            onSuccess: () => navigation.goBack(),
            onError: (e) => Alert.alert('Could not delete', getErrorMessage(e)),
          }),
      },
    ]);
  };

  const ringColor = budget ? budgetStatusColor(budget.status, c) : c.primary;
  const usedPct = budget ? Math.min(budget.percent, 100) : 0;
  const remainingPct = Math.max(0, 100 - usedPct);
  const overlayBg = isDark ? 'rgba(2,6,23,0.82)' : 'rgba(248,250,252,0.86)';

  return (
    <AuthLayout center={false} onBack={() => navigation.goBack()}>
      <View style={styles.content}>
        <Animated.View entering={FadeIn.duration(450)} style={styles.titleBlock}>
          <Text style={[styles.title, { color: c.text }]}>{screenTitle}</Text>
          <Text style={[styles.subtitle, { color: c.textMuted }]}>{formatMonth(month)}</Text>
        </Animated.View>

        {budget ? (
          <>
            {/* Overview + progress */}
            <GlassCard delay={70}>
              <View style={styles.ringWrap}>
                <CircularProgress
                  percent={budget.percent}
                  color={ringColor}
                  track={c.inputBorder}
                  size={156}
                  strokeWidth={13}
                >
                  <Text style={[styles.ringPct, { color: c.text }]}>{usedPct}%</Text>
                  <Text style={[styles.ringCap, { color: c.textMuted }]}>used</Text>
                </CircularProgress>
                <View style={styles.pillWrap}>
                  <StatusPill status={budget.status} c={c} />
                </View>
              </View>

              <View style={styles.legend}>
                <View style={styles.legendItem}>
                  <View style={[styles.dot, { backgroundColor: ringColor }]} />
                  <Text style={[styles.legendText, { color: c.textMuted }]}>Spent {usedPct}%</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.dot, { backgroundColor: c.inputBorder }]} />
                  <Text style={[styles.legendText, { color: c.textMuted }]}>
                    Remaining {remainingPct}%
                  </Text>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: c.glassBorder }]} />

              <View style={styles.statsRow}>
                <StatBlock label="Budget" value={formatCurrency(budget.amount)} c={c} />
                <StatBlock
                  label="Spent"
                  value={formatCurrency(budget.spent)}
                  color={ringColor}
                  c={c}
                />
                <StatBlock
                  label="Remaining"
                  value={formatCurrency(budget.remaining)}
                  color={budget.remaining < 0 ? c.danger : c.text}
                  c={c}
                />
              </View>
            </GlassCard>

            {/* AI insight */}
            <GlassCard delay={130}>
              <View style={styles.insight}>
                <View style={[styles.insightIcon, { backgroundColor: `${c.secondary}22` }]}>
                  <SparkleIcon size={18} color={c.secondary} />
                </View>
                <Text style={[styles.insightText, { color: c.text }]}>
                  {insightFor(budget, scopeNoun)}
                </Text>
              </View>
            </GlassCard>
          </>
        ) : !isEditing ? (
          <GlassCard delay={70}>
            <View style={styles.empty}>
              <View
                style={[
                  styles.emptyIcon,
                  { backgroundColor: `${c.primary}1f`, borderColor: c.glassBorder },
                ]}
              >
                <TargetIcon size={30} color={c.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: c.text }]}>No budget yet</Text>
              <Text style={[styles.emptySub, { color: c.textMuted }]}>
                Set a {scopeNoun} to start tracking your spending against a monthly limit.
              </Text>
            </View>
          </GlassCard>
        ) : null}

        {/* Input + actions */}
        <GlassCard delay={budget ? 190 : 130}>
          <View style={styles.form}>
            <FloatingLabelInput
              label="Monthly budget amount"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              icon={<Text style={[styles.prefix, { color: c.inputIcon }]}>$</Text>}
              error={error}
              success={valid}
              returnKeyType="done"
              onSubmitEditing={handleSave}
            />
            <GradientButton
              title={isEditing ? 'Save budget' : 'Set budget'}
              onPress={handleSave}
              loading={submitting}
              disabled={!valid}
            />
            {isEditing ? (
              <PressableScale
                onPress={handleDelete}
                disabled={remove.isPending}
                style={styles.delete}
                accessibilityLabel="Delete budget"
              >
                <TrashIcon size={18} color={c.danger} />
                <Text style={[styles.deleteText, { color: c.danger }]}>Delete budget</Text>
              </PressableScale>
            ) : null}
          </View>
        </GlassCard>
      </View>

      <Modal visible={done} transparent statusBarTranslucent animationType="fade">
        <View style={[styles.overlay, { backgroundColor: overlayBg }]}>
          <SuccessCheck size={112} />
          <Text style={[styles.overlayTitle, { color: c.text }]}>
            {isEditing ? 'Budget updated' : 'Budget set'}
          </Text>
          <Text style={[styles.overlaySub, { color: c.textMuted }]}>
            {formatCurrency(numeric)} · {formatMonth(month)}
          </Text>
        </View>
      </Modal>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg },
  titleBlock: { gap: spacing.xs },
  title: { fontSize: 28, fontFamily: fontFamily.bold, letterSpacing: -0.4 },
  subtitle: { fontSize: 15, fontFamily: fontFamily.regular },

  // Overview + progress
  ringWrap: { alignItems: 'center', gap: spacing.md },
  ringPct: { fontSize: 34, fontFamily: fontFamily.extrabold },
  ringCap: { fontSize: 13, fontFamily: fontFamily.medium },
  pillWrap: { marginTop: spacing.xs },
  pill: { borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 5 },
  pillText: { fontSize: 12, fontFamily: fontFamily.bold, letterSpacing: 0.3 },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xl,
    marginTop: spacing.lg,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 9, height: 9, borderRadius: 5 },
  legendText: { fontSize: 13, fontFamily: fontFamily.medium },
  divider: { height: StyleSheet.hairlineWidth, opacity: 0.8, marginVertical: spacing.lg },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: { flex: 1, alignItems: 'center', gap: 3 },
  statValue: { fontSize: 16, fontFamily: fontFamily.bold },
  statLabel: { fontSize: 12, fontFamily: fontFamily.medium },

  // Insight
  insight: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  insightIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightText: { flex: 1, fontSize: 14, lineHeight: 20, fontFamily: fontFamily.medium },

  // Empty state
  empty: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  emptyTitle: { fontSize: 17, fontFamily: fontFamily.bold },
  emptySub: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
    maxWidth: 260,
  },

  // Input + actions
  form: { gap: spacing.lg },
  prefix: { fontSize: 18, fontFamily: fontFamily.semibold },
  delete: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  deleteText: { fontSize: 15, fontFamily: fontFamily.semibold },

  // Success overlay
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  overlayTitle: { fontSize: 24, fontFamily: fontFamily.bold, marginTop: spacing.sm },
  overlaySub: { fontSize: 15, fontFamily: fontFamily.medium },
});
