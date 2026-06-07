import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedBackground } from '@/components/animations/AnimatedBackground';
import { IncomeExpenseChart } from '@/components/analytics/IncomeExpenseChart';
import { MonthlyBarChart } from '@/components/analytics/MonthlyBarChart';
import { ProportionBar } from '@/components/analytics/ProportionBar';
import { GlassCard } from '@/components/cards/GlassCard';
import { ExpensePieCard } from '@/components/charts/ExpensePieCard';
import { AnimatedCounter } from '@/components/dashboard/AnimatedCounter';
import { Skeleton } from '@/components/dashboard/Skeleton';
import { SparkleIcon } from '@/components/icons';
import { useStats } from '@/hooks/useStats';
import { type AuthPalette, useAuthTheme } from '@/theme/authTheme';
import { fontFamily } from '@/theme/typography';

function Stat({
  label,
  value,
  color,
  c,
}: {
  label: string;
  value: number;
  color: string;
  c: AuthPalette;
}) {
  return (
    <View style={styles.stat}>
      <View style={styles.statLabelRow}>
        <View style={[styles.statDot, { backgroundColor: color }]} />
        <Text style={[styles.statLabel, { color: c.textMuted }]}>{label}</Text>
      </View>
      <AnimatedCounter value={value} style={[styles.statValue, { color: c.text }]} />
    </View>
  );
}

export function AnalyticsScreen() {
  const { c } = useAuthTheme();
  const stats = useStats();

  const data = stats.data;
  const monthly = data?.monthly ?? [];
  const byCategory = data?.byCategory ?? [];
  const summary = data?.summary;
  const income = summary?.income ?? 0;
  const expense = summary?.expense ?? 0;
  const net = summary?.balance ?? 0;
  const totalFlow = income + expense;
  const incomePct = totalFlow > 0 ? income / totalFlow : 0.5;
  const hasData = (summary?.count ?? 0) > 0;

  return (
    <View style={[styles.root, { backgroundColor: c.gradient[0] }]}>
      <AnimatedBackground />
      <SafeAreaView style={styles.fill} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={stats.isRefetching}
              onRefresh={stats.refetch}
              tintColor={c.primary}
              colors={[c.primary]}
            />
          }
        >
          <Animated.View entering={FadeIn.duration(450)} style={styles.header}>
            <Text style={[styles.title, { color: c.text }]}>Analytics</Text>
            <Text style={[styles.subtitle, { color: c.textMuted }]}>
              Understand where your money goes
            </Text>
          </Animated.View>

          {stats.isLoading ? (
            <>
              <GlassCard>
                <Skeleton width={150} height={16} />
                <View style={styles.skelGap} />
                <Skeleton width="100%" height={170} radius={16} />
              </GlassCard>
              <GlassCard delay={80}>
                <Skeleton width={150} height={16} />
                <View style={styles.skelGap} />
                <Skeleton width="100%" height={150} radius={16} />
              </GlassCard>
            </>
          ) : !hasData ? (
            <GlassCard delay={60}>
              <View style={styles.empty}>
                <View
                  style={[
                    styles.emptyIcon,
                    { backgroundColor: `${c.accent}22`, borderColor: c.glassBorder },
                  ]}
                >
                  <SparkleIcon size={26} color={c.accent} />
                </View>
                <Text style={[styles.emptyTitle, { color: c.text }]}>Not enough data yet</Text>
                <Text style={[styles.emptyText, { color: c.textMuted }]}>
                  Add a few transactions and your spending analytics will appear here.
                </Text>
              </View>
            </GlassCard>
          ) : (
            <>
              {/* Income vs Expense */}
              <GlassCard delay={60}>
                <Text style={[styles.cardTitle, { color: c.text }]}>Income vs Expense</Text>
                <View style={styles.statsRow}>
                  <Stat label="Income" value={income} color={c.success} c={c} />
                  <Stat label="Expense" value={expense} color={c.danger} c={c} />
                  <Stat label="Net" value={net} color={net >= 0 ? c.success : c.danger} c={c} />
                </View>
                <ProportionBar incomePct={incomePct} c={c} />
                <View style={styles.chartGap} />
                <IncomeExpenseChart monthly={monthly} c={c} />
              </GlassCard>

              {/* Category spending */}
              <GlassCard delay={100}>
                <Text style={[styles.cardTitle, { color: c.text }]}>Category spending</Text>
                <ExpensePieCard data={byCategory} embedded />
              </GlassCard>

              {/* Monthly comparison */}
              <GlassCard delay={140}>
                <Text style={[styles.cardTitle, { color: c.text }]}>Monthly comparison</Text>
                <Text style={[styles.cardSub, { color: c.textMuted }]}>
                  Spending by month — tap a bar for detail
                </Text>
                <View style={styles.chartGap} />
                <MonthlyBarChart monthly={monthly} c={c} />
              </GlassCard>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  fill: { flex: 1 },
  content: { padding: 20, paddingBottom: 32, gap: 16 },
  header: { marginBottom: 2 },
  title: { fontSize: 28, fontFamily: fontFamily.bold, letterSpacing: -0.4 },
  subtitle: { fontSize: 15, fontFamily: fontFamily.regular, marginTop: 2 },
  cardTitle: { fontSize: 16, fontFamily: fontFamily.bold, marginBottom: 14 },
  cardSub: { fontSize: 13, fontFamily: fontFamily.regular, marginTop: -8, marginBottom: 4 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  stat: { flex: 1, gap: 6 },
  statLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statDot: { width: 8, height: 8, borderRadius: 4 },
  statLabel: { fontSize: 12, fontFamily: fontFamily.medium },
  statValue: { fontSize: 17, fontFamily: fontFamily.bold },
  chartGap: { height: 16 },
  skelGap: { height: 14 },
  empty: { alignItems: 'center', gap: 8, paddingVertical: 18 },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 16, fontFamily: fontFamily.bold },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
    maxWidth: 260,
  },
});
