import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/Card';
import { ExpensePieCard } from '@/components/charts/ExpensePieCard';
import { FadeInView } from '@/components/FadeInView';
import { useAdminStats, useAdminUsers } from '@/hooks/useAdmin';
import { useTheme } from '@/hooks/useTheme';
import type { ThemeColors } from '@/theme/palette';
import type { AdminUserRow } from '@/types/admin';
import type { CategoryTotal } from '@/types/stats';
import { getErrorMessage } from '@/utils/getErrorMessage';
import { formatCurrency } from '@/utils/formatCurrency';

export function AdminScreen() {
  const { colors } = useTheme();
  const stats = useAdminStats();
  const users = useAdminUsers(1, 8);

  const refreshing = stats.isRefetching || users.isRefetching;
  const onRefresh = () => {
    stats.refetch();
    users.refetch();
  };

  // Platform-wide expenses per category, reusing the dashboard pie.
  const expenseByCategory: CategoryTotal[] = (stats.data?.categories ?? [])
    .filter((c) => c.expense > 0)
    .map((c) => ({ category: c.category, total: c.expense }));

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
          <Text style={[styles.title, { color: colors.text }]}>Admin 🛡️</Text>
          <Text style={[styles.sub, { color: colors.textMuted }]}>Platform overview</Text>
        </FadeInView>

        {stats.isLoading ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : stats.isError ? (
          <Card>
            <Text style={[styles.error, { color: colors.expense }]}>
              {getErrorMessage(stats.error)}
            </Text>
          </Card>
        ) : (
          <>
            <FadeInView delay={60}>
              <View style={[styles.hero, { backgroundColor: colors.primary }]}>
                <Text style={styles.heroLabel}>Net balance (all users)</Text>
                <Text style={styles.heroValue}>{formatCurrency(stats.data?.netBalance ?? 0)}</Text>
              </View>
            </FadeInView>

            <FadeInView delay={100}>
              <View style={styles.statRow}>
                <Card style={styles.statTile}>
                  <Text style={[styles.statLabel, { color: colors.textMuted }]}>Total users</Text>
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {stats.data?.totalUsers ?? 0}
                  </Text>
                </Card>
                <Card style={styles.statTile}>
                  <Text style={[styles.statLabel, { color: colors.textMuted }]}>Transactions</Text>
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {stats.data?.totalTransactions ?? 0}
                  </Text>
                </Card>
              </View>
            </FadeInView>

            <FadeInView delay={140}>
              <View style={styles.statRow}>
                <Card style={styles.statTile}>
                  <Text style={[styles.statLabel, { color: colors.textMuted }]}>Total income</Text>
                  <Text style={[styles.statValue, { color: colors.income }]}>
                    {formatCurrency(stats.data?.totalIncome ?? 0)}
                  </Text>
                </Card>
                <Card style={styles.statTile}>
                  <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                    Total expenses
                  </Text>
                  <Text style={[styles.statValue, { color: colors.expense }]}>
                    {formatCurrency(stats.data?.totalExpenses ?? 0)}
                  </Text>
                </Card>
              </View>
            </FadeInView>

            <FadeInView delay={180}>
              <ExpensePieCard data={expenseByCategory} />
            </FadeInView>

            <FadeInView delay={220}>
              <Card>
                <Text style={[styles.cardTitle, { color: colors.text }]}>Users</Text>
                {users.isLoading ? (
                  <ActivityIndicator color={colors.primary} style={styles.usersLoader} />
                ) : (users.data?.items.length ?? 0) === 0 ? (
                  <Text style={[styles.empty, { color: colors.textMuted }]}>No users yet.</Text>
                ) : (
                  <>
                    {users.data?.items.map((u) => (
                      <UserRow key={u.id} user={u} colors={colors} />
                    ))}
                    {(users.data?.total ?? 0) > (users.data?.items.length ?? 0) && (
                      <Text style={[styles.more, { color: colors.textMuted }]}>
                        Showing {users.data?.items.length} of {users.data?.total}
                      </Text>
                    )}
                  </>
                )}
              </Card>
            </FadeInView>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function UserRow({ user, colors }: { user: AdminUserRow; colors: ThemeColors }) {
  const isAdmin = user.role === 'ADMIN';
  return (
    <View style={styles.row}>
      <View style={[styles.avatar, { backgroundColor: colors.cardAlt }]}>
        <Text style={[styles.avatarText, { color: colors.text }]}>
          {user.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.rowMiddle}>
        <View style={styles.nameRow}>
          <Text style={[styles.rowTitle, { color: colors.text }]} numberOfLines={1}>
            {user.name}
          </Text>
          {isAdmin && (
            <View style={[styles.badge, { backgroundColor: `${colors.primary}22` }]}>
              <Text style={[styles.badgeText, { color: colors.primary }]}>ADMIN</Text>
            </View>
          )}
        </View>
        <Text style={[styles.rowSub, { color: colors.textMuted }]} numberOfLines={1}>
          {user.email}
        </Text>
      </View>
      <Text style={[styles.rowCount, { color: colors.textMuted }]}>
        {user.transactionCount} txns
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { gap: 14, padding: 16 },
  title: { fontSize: 24, fontWeight: '800' },
  sub: { fontSize: 14, marginTop: 2 },
  loader: { marginVertical: 32 },
  error: { fontSize: 14, paddingVertical: 8, textAlign: 'center' },
  hero: { borderRadius: 18, padding: 22 },
  heroLabel: { color: '#dbeafe', fontSize: 14 },
  heroValue: { color: '#ffffff', fontSize: 34, fontWeight: '800', marginTop: 4 },
  statRow: { flexDirection: 'row', gap: 14 },
  statTile: { flex: 1 },
  statLabel: { fontSize: 13 },
  statValue: { fontSize: 20, fontWeight: '700', marginTop: 4 },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  empty: { fontSize: 14, paddingVertical: 16, textAlign: 'center' },
  usersLoader: { marginVertical: 16 },
  more: { fontSize: 13, marginTop: 8, textAlign: 'center' },
  row: { alignItems: 'center', flexDirection: 'row', gap: 12, paddingVertical: 8 },
  avatar: {
    alignItems: 'center',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  avatarText: { fontSize: 16, fontWeight: '700' },
  rowMiddle: { flex: 1 },
  nameRow: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  rowTitle: { fontSize: 15, fontWeight: '600', flexShrink: 1 },
  badge: { borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  rowSub: { fontSize: 13, marginTop: 2 },
  rowCount: { fontSize: 13 },
});
