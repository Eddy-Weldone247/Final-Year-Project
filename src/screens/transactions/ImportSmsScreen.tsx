import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AutoCaptureToggle } from '@/components/AutoCaptureToggle';
import { Button } from '@/components/Button';
import { FadeInView } from '@/components/FadeInView';
import { ScreenContainer } from '@/components/ScreenContainer';
import { getCategoryMeta } from '@/constants/categories';
import { useTheme } from '@/hooks/useTheme';
import { useCreateTransaction } from '@/hooks/useTransactions';
import { useSmsImport } from '@/hooks/useSmsImport';
import type { TransactionsStackParamList } from '@/navigation/types';
import { notifySmsImported } from '@/services/appNotifications';
import { computeFingerprint } from '@/services/sms/dedupe';
import { toCreatePayload } from '@/services/sms/toTransaction';
import type { ParsedSms } from '@/services/sms/types';
import { useImportedSmsStore } from '@/store/importedSmsStore';
import { formatCurrency, formatDate } from '@/utils/formatCurrency';
import { getErrorMessage } from '@/utils/getErrorMessage';

type Props = NativeStackScreenProps<TransactionsStackParamList, 'ImportSms'>;

export function ImportSmsScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { status, candidates, error, scan } = useSmsImport();
  const create = useCreateTransaction();
  const markImported = useImportedSmsStore((state) => state.markImported);

  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [importing, setImporting] = useState(false);

  // Select everything by default whenever a new scan completes.
  useEffect(() => {
    setSelected(Object.fromEntries(candidates.map((c) => [c.smsId, true])));
  }, [candidates]);

  const selectedList = useMemo(
    () => candidates.filter((c) => selected[c.smsId]),
    [candidates, selected],
  );

  const toggle = (id: string) => setSelected((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleImport = async () => {
    if (selectedList.length === 0) return;
    setImporting(true);
    const imported: string[] = [];
    const fingerprints: string[] = [];
    try {
      for (const candidate of selectedList) {
        await create.mutateAsync(toCreatePayload(candidate));
        notifySmsImported(candidate.provider);
        imported.push(candidate.smsId);
        fingerprints.push(computeFingerprint(candidate));
      }
      markImported(imported, fingerprints);
      Alert.alert('Imported', `${imported.length} transaction(s) created from SMS.`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      markImported(imported, fingerprints); // keep the ones that already succeeded
      Alert.alert(
        'Import incomplete',
        `${imported.length} created before an error: ${getErrorMessage(e)}`,
      );
    } finally {
      setImporting(false);
    }
  };

  if (status === 'unavailable') {
    return (
      <ScreenContainer>
        <Notice
          title="Development build required"
          body="Reading SMS needs native Android permissions that Expo Go doesn't include. Build a development build (see docs/SMS_IMPORT.md), install it on your phone, then return here to import bank & mobile-money alerts."
        />
      </ScreenContainer>
    );
  }

  if (status === 'idle' || status === 'denied' || status === 'error') {
    return (
      <ScreenContainer center={false}>
        <FadeInView style={styles.intro}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Import from SMS</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              Scan recent bank & mobile-money messages (MTN, Telecel, AirtelTigo, banks) and turn
              them into transactions.
            </Text>
          </View>
          {status === 'denied' ? (
            <Text style={[styles.error, { color: colors.expense }]}>
              SMS permission was denied. Grant it to scan messages.
            </Text>
          ) : null}
          {status === 'error' ? (
            <Text style={[styles.error, { color: colors.expense }]}>{error}</Text>
          ) : null}
          <Button title="Scan messages" onPress={scan} />
          <AutoCaptureToggle />
        </FadeInView>
      </ScreenContainer>
    );
  }

  if (status === 'scanning') {
    return (
      <ScreenContainer>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Scanning your messages…
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  // status === 'ready'
  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <FlatList
        data={candidates}
        keyExtractor={(c) => c.smsId}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <Text style={[styles.listHeader, { color: colors.textMuted }]}>
            {candidates.length} transaction{candidates.length === 1 ? '' : 's'} found
          </Text>
        }
        ListEmptyComponent={
          <Notice
            title="Nothing new to import"
            body="No new financial SMS were found in the last 90 days (already-imported messages are skipped)."
          />
        }
        renderItem={({ item, index }) => (
          <FadeInView delay={Math.min(index, 8) * 40}>
            <CandidateRow
              item={item}
              selected={!!selected[item.smsId]}
              onToggle={() => toggle(item.smsId)}
            />
          </FadeInView>
        )}
      />
      {candidates.length > 0 ? (
        <View
          style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}
        >
          <Button
            title={importing ? 'Importing…' : `Import ${selectedList.length} selected`}
            onPress={handleImport}
            loading={importing}
            disabled={selectedList.length === 0}
          />
        </View>
      ) : null}
    </View>
  );
}

function CandidateRow({
  item,
  selected,
  onToggle,
}: {
  item: ParsedSms;
  selected: boolean;
  onToggle: () => void;
}) {
  const { colors } = useTheme();
  const meta = getCategoryMeta(item.category);
  const isIncome = item.type === 'INCOME';
  return (
    <Pressable onPress={onToggle} style={[styles.row, { backgroundColor: colors.card }]}>
      <View
        style={[
          styles.checkbox,
          { borderColor: selected ? colors.primary : colors.inputBorder },
          selected ? { backgroundColor: colors.primary } : null,
        ]}
      >
        {selected ? <Text style={[styles.check, { color: colors.onPrimary }]}>✓</Text> : null}
      </View>
      <Text style={styles.rowIcon}>{meta.icon}</Text>
      <View style={styles.rowMiddle}>
        <Text style={[styles.rowTitle, { color: colors.text }]} numberOfLines={1}>
          {item.merchant || meta.label}
        </Text>
        <Text style={[styles.rowSub, { color: colors.textMuted }]} numberOfLines={1}>
          {item.provider} · {formatDate(item.date)}
        </Text>
      </View>
      <Text style={[styles.amount, { color: isIncome ? colors.income : colors.expense }]}>
        {isIncome ? '+' : '-'}
        {formatCurrency(item.amount)}
      </Text>
    </Pressable>
  );
}

function Notice({ title, body }: { title: string; body: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.notice, { backgroundColor: colors.card }]}>
      <Text style={[styles.noticeTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.noticeBody, { color: colors.textMuted }]}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  intro: { gap: 16 },
  header: { gap: 6, marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '700' },
  subtitle: { fontSize: 15 },
  center: { alignItems: 'center', gap: 12, paddingVertical: 48 },
  error: { fontSize: 14 },
  list: { padding: 16 },
  listHeader: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  row: {
    alignItems: 'center',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
    padding: 12,
  },
  checkbox: {
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 2,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  check: { fontSize: 13, fontWeight: '800' },
  rowIcon: { fontSize: 20 },
  rowMiddle: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '600' },
  rowSub: { fontSize: 13, marginTop: 2 },
  amount: { fontSize: 15, fontWeight: '700' },
  footer: { borderTopWidth: 1, padding: 16 },
  notice: { borderRadius: 12, gap: 8, padding: 16 },
  noticeTitle: { fontSize: 16, fontWeight: '700' },
  noticeBody: { fontSize: 14, lineHeight: 20 },
});
