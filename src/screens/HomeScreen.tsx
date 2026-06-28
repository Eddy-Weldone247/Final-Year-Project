import { Ionicons } from '@expo/vector-icons';
import { type BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedBackground } from '@/components/animations/AnimatedBackground';
import { PressableScale } from '@/components/animations/PressableScale';
import { Avatar } from '@/components/Avatar';
import { GlassCard } from '@/components/cards/GlassCard';
import { ExpensePieCard } from '@/components/charts/ExpensePieCard';
import { AIInsightCard } from '@/components/dashboard/AIInsightCard';
import { BalanceHero } from '@/components/dashboard/BalanceHero';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { Skeleton } from '@/components/dashboard/Skeleton';
import { BellIcon, SparkleIcon } from '@/components/icons';
import { getCategoryMeta } from '@/constants/categories';
import { useStats } from '@/hooks/useStats';
import { useTransactions } from '@/hooks/useTransactions';
import type { AppTabParamList } from '@/navigation/types';
import { useAuthStore } from '@/store/authStore';
import { type AuthPalette, useAuthTheme } from '@/theme/authTheme';
import { fontFamily } from '@/theme/typography';
import type { Transaction } from '@/types/transaction';
import { formatCurrency, formatDate } from '@/utils/formatCurrency';

type Props = BottomTabScreenProps<AppTabParamList, 'Home'>;

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export function HomeScreen({ navigation }: Props) {
  const { c } = useAuthTheme();
  const user = useAuthStore((state) => state.user);
  const stats = useStats();
  const transactions = useTransactions();

  const summary = stats.data?.summary;
  const monthly = stats.data?.monthly ?? [];
  const thisMonth = monthly[monthly.length - 1];
  const income = thisMonth?.income ?? 0;
  const expense = thisMonth?.expense ?? 0;
  const balance = summary?.balance ?? 0;
  const daily = stats.data?.daily ?? [];

  const recent = transactions.data?.pages[0]?.items.slice(0, 5) ?? [];
  const refreshing = stats.isRefetching || transactions.isRefetching;
  const onRefresh = () => {
    stats.refetch();
    transactions.refetch();
  };

  const goToList = () => navigation.navigate('Transactions', { screen: 'TransactionList' });

  return (
    <View style={[styles.root, { backgroundColor: c.gradient[0] }]}>
      <AnimatedBackground />
      <SafeAreaView style={styles.fill} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />
          }
        >
          {/* Header */}
          <Animated.View entering={FadeIn.duration(500)} style={styles.header}>
            <Avatar uri={user?.avatarUrl} name={user?.name ?? 'You'} size={46} />
            <View style={styles.headerText}>
              <Text style={[styles.greeting, { color: c.textMuted }]}>{greeting()},</Text>
              <Text style={[styles.name, { color: c.text }]} numberOfLines={1}>
                {user?.name?.split(' ')[0] ?? 'there'} 👋
              </Text>
            </View>
            <PressableScale
              onPress={() =>
                Alert.alert('Notifications', "You're all caught up — alerts are coming soon.")
              }
              accessibilityLabel="Notifications"
              style={styles.bellWrap}
            >
              <BlurView
                intensity={c.blurIntensity}
                tint={c.blurTint}
                experimentalBlurMethod="dimezisBlurView"
                style={styles.bellClip}
              >
                <View
                  style={[styles.bell, { backgroundColor: c.glassBg, borderColor: c.glassBorder }]}
                >
                  <BellIcon size={22} color={c.text} />
                  <View
                    style={[
                      styles.bellDot,
                      { backgroundColor: c.danger, borderColor: c.gradient[0] },
                    ]}
                  />
                </View>
              </BlurView>
            </PressableScale>
          </Animated.View>

          {/* Balance card (with smooth spending chart) */}
          <BalanceHero balance={balance} income={income} expense={expense} daily={daily} />

          {/* Spending breakdown */}
          <GlassCard delay={100}>
            <Text style={[styles.breakdownTitle, { color: c.text }]}>Spending Breakdown</Text>
            {stats.isLoading ? (
              <View style={styles.breakdownSkeleton}>
                <Skeleton width={120} height={120} radius={60} />
                <View style={styles.skelRowMid}>
                  <Skeleton width="100%" height={12} />
                  <Skeleton width="80%" height={12} />
                  <Skeleton width="90%" height={12} />
                  <Skeleton width="60%" height={12} />
                </View>
              </View>
            ) : (
              <ExpensePieCard
                data={stats.data?.byCategory ?? []}
                embedded
                onCategoryPress={() =>
                  navigation.navigate('Transactions', { screen: 'TransactionList' })
                }
              />
            )}
          </GlassCard>

          {/* Quick actions */}
          <Animated.View entering={FadeInDown.duration(560).delay(120).springify().damping(16)}>
            <QuickActions
              onAddExpense={() => navigation.navigate('Add', { type: 'EXPENSE' })}
              onAddIncome={() => navigation.navigate('Add', { type: 'INCOME' })}
              onSetBudget={() => navigation.navigate('Budgets', { screen: 'BudgetOverview' })}
            />
          </Animated.View>

          {/* AI insight */}
          {stats.data ? (
            <AIInsightCard stats={stats.data} />
          ) : (
            <GlassCard delay={160}>
              <Skeleton width={150} height={16} />
              <View style={styles.skelGap} />
              <Skeleton width="90%" height={14} />
            </GlassCard>
          )}

          {/* Recent transactions */}
          <GlassCard delay={220}>
            <View style={styles.recentHeader}>
              <Text style={[styles.cardTitle, { color: c.text }]}>Recent transactions</Text>
              <Text style={[styles.link, { color: c.primary }]} onPress={goToList}>
                See all
              </Text>
            </View>

            {transactions.isLoading ? (
              <View style={styles.skelList}>
                {[0, 1, 2].map((i) => (
                  <View key={i} style={styles.skelRow}>
                    <Skeleton width={40} height={40} radius={20} />
                    <View style={styles.skelRowMid}>
                      <Skeleton width="70%" height={13} />
                      <Skeleton width="40%" height={11} />
                    </View>
                    <Skeleton width={56} height={14} />
                  </View>
                ))}
              </View>
            ) : recent.length === 0 ? (
              <EmptyState c={c} />
            ) : (
              recent.map((t, i) => (
                <RecentRow
                  key={t.id}
                  transaction={t}
                  c={c}
                  showDivider={i < recent.length - 1}
                  onPress={() =>
                    navigation.navigate('Transactions', {
                      screen: 'EditTransaction',
                      params: { transaction: t },
                    })
                  }
                />
              ))
            )}
          </GlassCard>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function RecentRow({
  transaction,
  c,
  showDivider,
  onPress,
}: {
  transaction: Transaction;
  c: AuthPalette;
  showDivider: boolean;
  onPress: () => void;
}) {
  const meta = getCategoryMeta(transaction.category);
  const isIncome = transaction.type === 'INCOME';
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.98}
      accessibilityLabel={transaction.note || meta.label}
    >
      <View style={styles.row}>
        <View style={[styles.rowIcon, { backgroundColor: `${meta.color}29` }]}>
          <Ionicons name={meta.ionicon} size={20} color={meta.color} />
        </View>
        <View style={styles.rowMiddle}>
          <Text style={[styles.rowTitle, { color: c.text }]} numberOfLines={1}>
            {transaction.note || meta.label}
          </Text>
          <Text style={[styles.rowSub, { color: c.textMuted }]} numberOfLines={1}>
            {meta.label} · {formatDate(transaction.date)}
          </Text>
        </View>
        <Text style={[styles.rowAmount, { color: isIncome ? c.success : c.danger }]}>
          {isIncome ? '+' : '-'}
          {formatCurrency(transaction.amount)}
        </Text>
      </View>
      {showDivider ? <View style={[styles.divider, { backgroundColor: c.glassBorder }]} /> : null}
    </PressableScale>
  );
}

function EmptyState({ c }: { c: AuthPalette }) {
  return (
    <View style={styles.empty}>
      <View
        style={[styles.emptyIcon, { backgroundColor: `${c.accent}22`, borderColor: c.glassBorder }]}
      >
        <SparkleIcon size={26} color={c.accent} />
      </View>
      <Text style={[styles.emptyTitle, { color: c.text }]}>No transactions yet</Text>
      <Text style={[styles.emptyText, { color: c.textMuted }]}>
        Add your first expense or income and it&apos;ll appear right here.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  fill: { flex: 1 },
  content: { gap: 16, padding: 20, paddingBottom: 32 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerText: { flex: 1 },
  greeting: { fontSize: 14, fontFamily: fontFamily.regular },
  name: { fontSize: 22, fontFamily: fontFamily.extrabold },
  bellWrap: { width: 46, height: 46, borderRadius: 16 },
  bellClip: { borderRadius: 16, overflow: 'hidden' },
  bell: {
    width: 46,
    height: 46,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellDot: {
    position: 'absolute',
    top: 11,
    right: 12,
    width: 9,
    height: 9,
    borderRadius: 5,
    borderWidth: 1.5,
  },
  cardTitle: { fontSize: 16, fontFamily: fontFamily.bold },
  breakdownTitle: { fontSize: 16, fontFamily: fontFamily.bold, marginBottom: 14 },
  breakdownSkeleton: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  recentHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  link: { fontSize: 14, fontFamily: fontFamily.semibold },
  skelGap: { height: 10 },
  skelList: { gap: 16, paddingTop: 6 },
  skelRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  skelRowMid: { flex: 1, gap: 7 },
  row: { alignItems: 'center', flexDirection: 'row', gap: 12, paddingVertical: 12 },
  rowIcon: {
    alignItems: 'center',
    borderRadius: 14,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  rowMiddle: { flex: 1 },
  rowTitle: { fontSize: 15, fontFamily: fontFamily.semibold },
  rowSub: { fontSize: 13, fontFamily: fontFamily.regular, marginTop: 2 },
  rowAmount: { fontSize: 15, fontFamily: fontFamily.bold },
  divider: { height: 1, opacity: 0.6 },
  empty: { alignItems: 'center', gap: 8, paddingVertical: 26 },
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
