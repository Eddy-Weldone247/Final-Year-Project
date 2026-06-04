import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FadeInView } from '@/components/FadeInView';
import { TransactionItem } from '@/components/TransactionItem';
import { CATEGORIES } from '@/constants/categories';
import { useTheme } from '@/hooks/useTheme';
import { useTransactions } from '@/hooks/useTransactions';
import type { TransactionsStackParamList } from '@/navigation/types';
import type { Category, TransactionFilters, TransactionType } from '@/types/transaction';

type Props = NativeStackScreenProps<TransactionsStackParamList, 'TransactionList'>;

const TYPE_FILTERS: { label: string; value?: TransactionType }[] = [
  { label: 'All' },
  { label: 'Income', value: 'INCOME' },
  { label: 'Expense', value: 'EXPENSE' },
];

export function TransactionListScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [type, setType] = useState<TransactionType | undefined>(undefined);
  const [category, setCategory] = useState<Category | undefined>(undefined);

  // Debounce the search box so we don't refetch on every keystroke.
  useEffect(() => {
    const id = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(id);
  }, [searchInput]);

  const filters: TransactionFilters = useMemo(
    () => ({ type, category, search: search || undefined }),
    [type, category, search],
  );

  const query = useTransactions(filters);
  const items = query.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['bottom']}>
      <View
        style={[
          styles.controls,
          { backgroundColor: colors.card, borderBottomColor: colors.border },
        ]}
      >
        <TextInput
          style={[styles.search, { backgroundColor: colors.cardAlt, color: colors.text }]}
          placeholder="Search by note…"
          placeholderTextColor={colors.placeholder}
          value={searchInput}
          onChangeText={setSearchInput}
          autoCapitalize="none"
          returnKeyType="search"
        />

        <View style={styles.typeRow}>
          {TYPE_FILTERS.map((f) => {
            const active = type === f.value;
            return (
              <Pressable
                key={f.label}
                onPress={() => setType(f.value)}
                style={[
                  styles.typeChip,
                  { backgroundColor: active ? colors.primary : colors.cardAlt },
                ]}
              >
                <Text
                  style={[
                    styles.typeChipText,
                    { color: active ? colors.onPrimary : colors.textSecondary },
                  ]}
                >
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catRow}
        >
          {CATEGORIES.map((c) => {
            const active = category === c.value;
            return (
              <Pressable
                key={c.value}
                onPress={() => setCategory(active ? undefined : c.value)}
                style={[
                  styles.catChip,
                  { backgroundColor: active ? colors.primaryTint : colors.cardAlt },
                ]}
              >
                <Text style={styles.catIcon}>{c.icon}</Text>
                <Text
                  style={[
                    styles.catLabel,
                    { color: active ? colors.primaryStrong : colors.textSecondary },
                    active ? styles.catLabelActive : null,
                  ]}
                >
                  {c.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={items}
        keyExtractor={(t) => t.id}
        contentContainerStyle={styles.list}
        renderItem={({ item, index }) => (
          <FadeInView delay={Math.min(index, 8) * 40}>
            <TransactionItem
              transaction={item}
              onPress={() => navigation.navigate('EditTransaction', { transaction: item })}
            />
          </FadeInView>
        )}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching && !query.isFetchingNextPage}
            onRefresh={query.refetch}
            tintColor={colors.primary}
          />
        }
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage();
        }}
        ListEmptyComponent={
          query.isLoading ? (
            <ActivityIndicator color={colors.primary} style={styles.loader} />
          ) : (
            <Text style={[styles.empty, { color: colors.textMuted }]}>
              No transactions match your filters.
            </Text>
          )
        }
        ListFooterComponent={
          query.isFetchingNextPage ? (
            <ActivityIndicator color={colors.primary} style={styles.footer} />
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  controls: {
    borderBottomWidth: 1,
    gap: 10,
    padding: 12,
  },
  search: {
    borderRadius: 10,
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  typeRow: { flexDirection: 'row', gap: 8 },
  typeChip: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  typeChipText: { fontSize: 14, fontWeight: '600' },
  catRow: { gap: 8, paddingRight: 12 },
  catChip: {
    alignItems: 'center',
    borderRadius: 16,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  catIcon: { fontSize: 14 },
  catLabel: { fontSize: 13 },
  catLabelActive: { fontWeight: '600' },
  list: { padding: 12 },
  loader: { marginTop: 32 },
  footer: { marginVertical: 12 },
  empty: { fontSize: 14, marginTop: 32, textAlign: 'center' },
});
