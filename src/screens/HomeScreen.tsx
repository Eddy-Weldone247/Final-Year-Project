import { type BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/Card';
import { ExpensePieCard } from '@/components/charts/ExpensePieCard';
import { DailyLineCard } from '@/components/charts/DailyLineCard';
import { MonthlyBarCard } from '@/components/charts/MonthlyBarCard';
import { FadeInView } from '@/components/FadeInView';
import { getCategoryMeta } from '@/constants/categories';
import { useStats } from '@/hooks/useStats';
import { useTheme } from '@/hooks/useTheme';
import { useTransactions } from '@/hooks/useTransactions';
import type { AppTabParamList } from '@/navigation/types';
import { useAuthStore } from '@/store/authStore';
import type { ThemeColors } from '@/theme/palette';
import type { Transaction } from '@/types/transaction';
import { formatCurrency, formatDate } from '@/utils/formatCurrency';

type Props = BottomTabScreenProps<AppTabParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const user = useAuthStore((state) => state.user);
  const stats = useStats();
  const transactions = useTransactions();

  const summary = stats.data?.summary;
  const recent = transactions.data?.pages[0]?.items.slice(0, 5) ?? [];
  const refreshing = stats.isRefetching || transactions.isRefetching;
  const onRefresh = () => {
    stats.refetch();
    transactions.refetch();
  };

  const goToList = () => navigation.navigate('Transactions', { screen: 'TransactionList' });

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <FadeInView>
          <Text style={[styles.greeting, { color: colors.text }]}>
            Hi, {user?.name?.split(' ')[0] ?? 'there'} 👋
          </Text>
          <Text style={[styles.sub, { color: colors.textMuted }]}>Your money at a glance</Text>
        </FadeInView>

        <FadeInView delay={60}>
          <View style={[styles.hero, { backgroundColor: colors.primary }]}>
            <Text style={styles.heroLabel}>Current balance</Text>
            <Text style={styles.heroValue}>{formatCurrency(summary?.balance ?? 0)}</Text>
          </View>
        </FadeInView>

        <FadeInView delay={100}>
          <View style={styles.statRow}>
            <Card style={styles.statTile}>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Total income</Text>
              <Text style={[styles.statValue, { color: colors.income }]}>
                {formatCurrency(summary?.income ?? 0)}
              </Text>
            </Card>
            <Card style={styles.statTile}>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Total expenses</Text>
              <Text style={[styles.statValue, { color: colors.expense }]}>
                {formatCurrency(summary?.expense ?? 0)}
              </Text>
            </Card>
          </View>
        </FadeInView>

        {stats.isLoading ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : (
          <>
            <FadeInView delay={140}>
              <ExpensePieCard data={stats.data?.byCategory ?? []} />
            </FadeInView>
            <FadeInView delay={180}>
              <MonthlyBarCard data={stats.data?.monthly ?? []} />
            </FadeInView>
            <FadeInView delay={220}>
              <DailyLineCard data={stats.data?.daily ?? []} />
            </FadeInView>
          </>
        )}

        <FadeInView delay={260}>
          <Card>
            <View style={styles.recentHeader}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Recent transactions</Text>
              <Text style={[styles.link, { color: colors.primary }]} onPress={goToList}>
                See all
              </Text>
            </View>
            {recent.length === 0 ? (
              <Text style={[styles.empty, { color: colors.textMuted }]}>No transactions yet.</Text>
            ) : (
              recent.map((t) => (
                <RecentRow
                  key={t.id}
                  transaction={t}
                  colors={colors}
                  onPress={() =>
                    navigation.navigate('Transactions', {
                      screen: 'EditTransaction',
                      params: { transaction: t },
                    })
                  }
                />
              ))
            )}
          </Card>
        </FadeInView>
      </ScrollView>
    </SafeAreaView>
  );
}

function RecentRow({
  transaction,
  colors,
  onPress,
}: {
  transaction: Transaction;
  colors: ThemeColors;
  onPress: () => void;
}) {
  const meta = getCategoryMeta(transaction.category);
  const isIncome = transaction.type === 'INCOME';
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <View style={[styles.rowIcon, { backgroundColor: `${meta.color}22` }]}>
        <Text style={styles.rowEmoji}>{meta.icon}</Text>
      </View>
      <View style={styles.rowMiddle}>
        <Text style={[styles.rowTitle, { color: colors.text }]} numberOfLines={1}>
          {transaction.note || meta.label}
        </Text>
        <Text style={[styles.rowSub, { color: colors.textMuted }]}>
          {formatDate(transaction.date)}
        </Text>
      </View>
      <Text style={[styles.rowAmount, { color: isIncome ? colors.income : colors.expense }]}>
        {isIncome ? '+' : '-'}
        {formatCurrency(transaction.amount)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { gap: 14, padding: 16 },
  greeting: { fontSize: 24, fontWeight: '800' },
  sub: { fontSize: 14, marginTop: 2 },
  hero: { borderRadius: 18, padding: 22 },
  heroLabel: { color: '#dbeafe', fontSize: 14 },
  heroValue: { color: '#ffffff', fontSize: 34, fontWeight: '800', marginTop: 4 },
  statRow: { flexDirection: 'row', gap: 14 },
  statTile: { flex: 1 },
  statLabel: { fontSize: 13 },
  statValue: { fontSize: 20, fontWeight: '700', marginTop: 4 },
  loader: { marginVertical: 32 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  recentHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  link: { fontSize: 14, fontWeight: '600' },
  empty: { fontSize: 14, paddingVertical: 16, textAlign: 'center' },
  row: { alignItems: 'center', flexDirection: 'row', gap: 12, paddingVertical: 8 },
  rowIcon: {
    alignItems: 'center',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  rowEmoji: { fontSize: 18 },
  rowMiddle: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '600' },
  rowSub: { fontSize: 13, marginTop: 2 },
  rowAmount: { fontSize: 15, fontWeight: '700' },
});
