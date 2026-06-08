import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { BlurView } from 'expo-blur';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedBackground } from '@/components/animations/AnimatedBackground';
import { PressableScale } from '@/components/animations/PressableScale';
import { Skeleton } from '@/components/dashboard/Skeleton';
import { CalendarIcon, CloseIcon, MailIcon, SearchIcon } from '@/components/icons';
import { SwipeableTransactionRow } from '@/components/transactions/SwipeableTransactionRow';
import { CATEGORIES } from '@/constants/categories';
import { useDeleteTransaction, useTransactions } from '@/hooks/useTransactions';
import type { TransactionsStackParamList } from '@/navigation/types';
import { type AuthPalette, useAuthTheme } from '@/theme/authTheme';
import { fontFamily } from '@/theme/typography';
import type { Category, Transaction, TransactionType } from '@/types/transaction';
import { formatDate } from '@/utils/formatCurrency';
import { getErrorMessage } from '@/utils/getErrorMessage';

type Props = NativeStackScreenProps<TransactionsStackParamList, 'TransactionList'>;

type RangePreset = 'all' | '7d' | '30d' | 'month' | 'custom';

const TYPE_FILTERS: { label: string; value?: TransactionType }[] = [
  { label: 'All' },
  { label: 'Income', value: 'INCOME' },
  { label: 'Expense', value: 'EXPENSE' },
];

const RANGE_FILTERS: { label: string; value: RangePreset }[] = [
  { label: 'All time', value: 'all' },
  { label: '7 days', value: '7d' },
  { label: '30 days', value: '30d' },
  { label: 'This month', value: 'month' },
  { label: 'Custom', value: 'custom' },
];

const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};
const endOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
};

function rangeFor(
  preset: RangePreset,
  from: Date,
  to: Date,
): { startDate?: string; endDate?: string } {
  if (preset === 'all') return {};
  if (preset === 'custom') {
    return { startDate: startOfDay(from).toISOString(), endDate: endOfDay(to).toISOString() };
  }
  const now = new Date();
  const start = new Date();
  if (preset === '7d') start.setDate(now.getDate() - 6);
  else if (preset === '30d') start.setDate(now.getDate() - 29);
  else if (preset === 'month') start.setDate(1);
  return { startDate: startOfDay(start).toISOString(), endDate: endOfDay(now).toISOString() };
}

/** Full-width, equal-segment type filter (proper flex — no overlap). */
function TypeSegmented({
  value,
  onChange,
  c,
}: {
  value?: TransactionType;
  onChange: (v?: TransactionType) => void;
  c: AuthPalette;
}) {
  return (
    <View style={[styles.segmented, { backgroundColor: c.inputBg, borderColor: c.inputBorder }]}>
      {TYPE_FILTERS.map((f) => {
        const active = value === f.value;
        return (
          <Pressable
            key={f.label}
            onPress={() => onChange(f.value)}
            style={styles.segItem}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <View style={[styles.segInner, active ? { backgroundColor: c.primary } : null]}>
              <Text style={[styles.segText, { color: active ? c.onPrimary : c.textMuted }]}>
                {f.label}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

/** A pill filter chip (used in the horizontal period / category rows). */
function Chip({
  label,
  active,
  onPress,
  icon,
  c,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  icon?: ReactNode;
  c: AuthPalette;
}) {
  return (
    <PressableScale onPress={onPress} scaleTo={0.94} accessibilityLabel={label}>
      <View
        style={[
          styles.chip,
          {
            backgroundColor: active ? `${c.primary}26` : c.inputBg,
            borderColor: active ? c.primary : c.inputBorder,
          },
        ]}
      >
        {icon}
        <Text style={[styles.chipText, { color: active ? c.primary : c.textMuted }]}>{label}</Text>
      </View>
    </PressableScale>
  );
}

function SkeletonRow({ c }: { c: AuthPalette }) {
  return (
    <View style={[styles.skelCard, { backgroundColor: c.glassBg, borderColor: c.glassBorder }]}>
      <Skeleton width={44} height={44} radius={14} />
      <View style={styles.skelMid}>
        <Skeleton width="60%" height={13} />
        <Skeleton width="40%" height={11} />
      </View>
      <Skeleton width={58} height={15} />
    </View>
  );
}

export function TransactionListScreen({ navigation }: Props) {
  const { c } = useAuthTheme();
  const remove = useDeleteTransaction();

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [type, setType] = useState<TransactionType | undefined>(undefined);
  const [category, setCategory] = useState<Category | undefined>(undefined);
  const [preset, setPreset] = useState<RangePreset>('all');
  const [from, setFrom] = useState<Date>(() => new Date(Date.now() - 6 * 86_400_000));
  const [to, setTo] = useState<Date>(() => new Date());
  const [picker, setPicker] = useState<'from' | 'to' | null>(null);

  useEffect(() => {
    const id = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(id);
  }, [searchInput]);

  const filters = useMemo(
    () => ({ type, category, search: search || undefined, ...rangeFor(preset, from, to) }),
    [type, category, search, preset, from, to],
  );

  const query = useTransactions(filters);
  const items = query.data?.pages.flatMap((p) => p.items) ?? [];

  const onDelete = (t: Transaction) => {
    Alert.alert('Delete transaction', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          remove.mutate(t.id, {
            onError: (e) => Alert.alert('Could not delete', getErrorMessage(e)),
          }),
      },
    ]);
  };

  const onPick = (event: DateTimePickerEvent, picked?: Date) => {
    if (Platform.OS !== 'ios') setPicker(null);
    if (event.type === 'set' && picked) {
      if (picker === 'from') setFrom(picked);
      else if (picker === 'to') setTo(picked);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: c.gradient[0] }]}>
      <AnimatedBackground />
      <SafeAreaView style={styles.fill} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: c.text }]}>Transactions</Text>
          <PressableScale
            onPress={() => navigation.navigate('ImportSms')}
            accessibilityLabel="Import from SMS"
            style={styles.importWrap}
          >
            <BlurView
              intensity={c.blurIntensity}
              tint={c.blurTint}
              experimentalBlurMethod="dimezisBlurView"
              style={styles.importClip}
            >
              <View
                style={[
                  styles.importBtn,
                  { backgroundColor: c.glassBg, borderColor: c.glassBorder },
                ]}
              >
                <MailIcon size={20} color={c.text} />
              </View>
            </BlurView>
          </PressableScale>
        </View>

        {/* Filters */}
        <View style={styles.filters}>
          <View style={[styles.search, { backgroundColor: c.inputBg, borderColor: c.inputBorder }]}>
            <SearchIcon size={18} color={c.inputIcon} />
            <TextInput
              style={[styles.searchInput, { color: c.text }]}
              placeholder="Search notes & merchants…"
              placeholderTextColor={c.textFaint}
              value={searchInput}
              onChangeText={setSearchInput}
              autoCapitalize="none"
              returnKeyType="search"
            />
            {searchInput.length > 0 ? (
              <Pressable onPress={() => setSearchInput('')} hitSlop={8}>
                <CloseIcon size={18} color={c.textMuted} />
              </Pressable>
            ) : null}
          </View>

          <TypeSegmented value={type} onChange={setType} c={c} />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            {RANGE_FILTERS.map((r) => (
              <Chip
                key={r.value}
                label={r.label}
                active={preset === r.value}
                onPress={() => setPreset(r.value)}
                icon={
                  r.value === 'custom' ? (
                    <CalendarIcon size={15} color={preset === 'custom' ? c.primary : c.inputIcon} />
                  ) : undefined
                }
                c={c}
              />
            ))}
          </ScrollView>

          {preset === 'custom' ? (
            <Animated.View entering={FadeIn.duration(200)} style={styles.rangeRow}>
              <Chip
                label={`From  ${formatDate(from.toISOString())}`}
                active={false}
                onPress={() => setPicker('from')}
                c={c}
              />
              <Chip
                label={`To  ${formatDate(to.toISOString())}`}
                active={false}
                onPress={() => setPicker('to')}
                c={c}
              />
            </Animated.View>
          ) : null}

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            {CATEGORIES.map((cat) => (
              <Chip
                key={cat.value}
                label={`${cat.icon} ${cat.label}`}
                active={category === cat.value}
                onPress={() => setCategory(category === cat.value ? undefined : cat.value)}
                c={c}
              />
            ))}
          </ScrollView>
        </View>

        {/* List (flex-bounded so it scrolls cleanly under the filters) */}
        <View style={styles.listWrap}>
          {query.isLoading ? (
            <View style={styles.list}>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <SkeletonRow key={i} c={c} />
              ))}
            </View>
          ) : (
            <FlatList
              style={styles.fill}
              data={items}
              keyExtractor={(t) => t.id}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
              renderItem={({ item, index }) => (
                <SwipeableTransactionRow
                  transaction={item}
                  index={index}
                  onEdit={(t) => navigation.navigate('EditTransaction', { transaction: t })}
                  onDelete={onDelete}
                />
              )}
              refreshControl={
                <RefreshControl
                  refreshing={query.isRefetching && !query.isFetchingNextPage}
                  onRefresh={query.refetch}
                  tintColor={c.primary}
                  colors={[c.primary]}
                />
              }
              onEndReachedThreshold={0.4}
              onEndReached={() => {
                if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage();
              }}
              ListEmptyComponent={
                <Animated.View entering={FadeIn.duration(300)} style={styles.empty}>
                  <View
                    style={[
                      styles.emptyIcon,
                      { backgroundColor: `${c.primary}22`, borderColor: c.glassBorder },
                    ]}
                  >
                    <SearchIcon size={26} color={c.primary} />
                  </View>
                  <Text style={[styles.emptyTitle, { color: c.text }]}>No transactions found</Text>
                  <Text style={[styles.emptyText, { color: c.textMuted }]}>
                    Try adjusting your search, filters, or date range.
                  </Text>
                </Animated.View>
              }
              ListFooterComponent={
                query.isFetchingNextPage ? (
                  <ActivityIndicator color={c.primary} style={styles.footer} />
                ) : null
              }
            />
          )}
        </View>
      </SafeAreaView>

      {picker ? (
        Platform.OS === 'ios' ? (
          <View style={styles.iosPickerWrap}>
            <BlurView
              intensity={c.blurIntensity + 20}
              tint={c.blurTint}
              experimentalBlurMethod="dimezisBlurView"
              style={[styles.iosPicker, { borderColor: c.glassBorder }]}
            >
              <DateTimePicker
                value={picker === 'from' ? from : to}
                mode="date"
                display="inline"
                maximumDate={new Date()}
                themeVariant={c.blurTint}
                accentColor={c.primary}
                onChange={(_e, d) => d && (picker === 'from' ? setFrom(d) : setTo(d))}
              />
              <Pressable onPress={() => setPicker(null)} style={styles.done} hitSlop={8}>
                <Text style={[styles.doneText, { color: c.primary }]}>Done</Text>
              </Pressable>
            </BlurView>
          </View>
        ) : (
          <DateTimePicker
            value={picker === 'from' ? from : to}
            mode="date"
            display="default"
            maximumDate={new Date()}
            onChange={onPick}
          />
        )
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  fill: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 10,
  },
  title: { fontSize: 28, fontFamily: fontFamily.bold, letterSpacing: -0.4 },
  importWrap: { width: 44, height: 44, borderRadius: 14 },
  importClip: { borderRadius: 14, overflow: 'hidden' },
  importBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filters: { paddingHorizontal: 20, gap: 12, paddingBottom: 14 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 48,
  },
  searchInput: { flex: 1, fontSize: 15, fontFamily: fontFamily.regular, padding: 0 },
  segmented: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
  },
  segItem: { flex: 1 },
  segInner: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingVertical: 9,
  },
  segText: { fontSize: 14, fontFamily: fontFamily.semibold },
  chipRow: { gap: 8, paddingRight: 8 },
  rangeRow: { flexDirection: 'row', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipText: { fontSize: 13, fontFamily: fontFamily.semibold },
  listWrap: { flex: 1 },
  list: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 28, flexGrow: 1 },
  footer: { marginVertical: 16 },
  empty: { alignItems: 'center', gap: 8, paddingTop: 60, paddingHorizontal: 24 },
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
  skelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  skelMid: { flex: 1, gap: 8 },
  iosPickerWrap: { position: 'absolute', left: 16, right: 16, bottom: 24 },
  iosPicker: { borderRadius: 20, borderWidth: 1, overflow: 'hidden', padding: 8 },
  done: { alignSelf: 'flex-end', paddingHorizontal: 12, paddingVertical: 8 },
  doneText: { fontSize: 15, fontFamily: fontFamily.semibold },
});
