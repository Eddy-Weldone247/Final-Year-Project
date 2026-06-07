import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import { GlassCard } from '@/components/cards/GlassCard';
import { SparkleIcon } from '@/components/icons';
import { getCategoryMeta } from '@/constants/categories';
import { useAuthTheme } from '@/theme/authTheme';
import { fontFamily } from '@/theme/typography';
import type { DashboardStats } from '@/types/stats';
import { formatCurrency } from '@/utils/formatCurrency';

interface Insight {
  headline: string;
  detail: string;
}

/** Heuristic spending insight derived from the user's live stats. */
function buildInsight(stats: DashboardStats): Insight {
  const thisMonth = stats.monthly[stats.monthly.length - 1];
  const income = thisMonth?.income ?? 0;
  const expense = thisMonth?.expense ?? 0;

  if (expense === 0 && income === 0) {
    return {
      headline: 'Start tracking to unlock insights',
      detail: "Add a transaction and I'll surface trends, projections, and budget tips.",
    };
  }

  const now = new Date();
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const projected = dayOfMonth > 0 ? (expense / dayOfMonth) * daysInMonth : expense;

  const totalExpense = stats.byCategory.reduce((sum, cat) => sum + cat.total, 0);
  const top = stats.byCategory[0];
  const topPct = top && totalExpense > 0 ? Math.round((top.total / totalExpense) * 100) : 0;
  const savingsRate = income > 0 ? Math.round(((income - expense) / income) * 100) : null;

  const parts: string[] = [];
  if (top) parts.push(`${getCategoryMeta(top.category).label} leads at ${topPct}% of spending`);
  if (savingsRate !== null) {
    parts.push(
      savingsRate >= 0
        ? `you're saving ${savingsRate}% of income`
        : `you're over income by ${-savingsRate}%`,
    );
  }

  return {
    headline: `On pace for ~${formatCurrency(projected)} this month`,
    detail: parts.length ? `${parts.join(' · ')}.` : 'Keep logging to reveal category trends.',
  };
}

export function AIInsightCard({ stats }: { stats: DashboardStats }) {
  const { c } = useAuthTheme();
  const insight = buildInsight(stats);

  return (
    <GlassCard delay={160}>
      <View style={styles.header}>
        <LinearGradient
          colors={[c.primary, c.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.badge}
        >
          <SparkleIcon size={18} color="#ffffff" />
        </LinearGradient>
        <Text style={[styles.title, { color: c.text }]}>Spending insights</Text>
        <View style={[styles.pill, { backgroundColor: `${c.accent}26` }]}>
          <Text style={[styles.pillText, { color: c.accent }]}>AI</Text>
        </View>
      </View>

      <Text style={[styles.headline, { color: c.text }]}>{insight.headline}</Text>
      <Text style={[styles.detail, { color: c.textMuted }]}>{insight.detail}</Text>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  badge: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { flex: 1, fontSize: 16, fontFamily: fontFamily.bold },
  pill: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  pillText: { fontSize: 11, fontFamily: fontFamily.extrabold, letterSpacing: 0.5 },
  headline: { fontSize: 17, fontFamily: fontFamily.bold, marginBottom: 4 },
  detail: { fontSize: 14, lineHeight: 20, fontFamily: fontFamily.regular },
});
