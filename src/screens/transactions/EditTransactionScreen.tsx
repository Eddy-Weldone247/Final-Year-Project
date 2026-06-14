import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Alert, Modal, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { PressableScale } from '@/components/animations/PressableScale';
import { SuccessCheck } from '@/components/animations/SuccessCheck';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { GradientButton } from '@/components/buttons/GradientButton';
import { GlassCard } from '@/components/cards/GlassCard';
import { NoteIcon, TrashIcon } from '@/components/icons';
import { FloatingLabelInput } from '@/components/inputs/FloatingLabelInput';
import { AmountField } from '@/components/transactions/AmountField';
import { CategoryChips } from '@/components/transactions/CategoryChips';
import { DateField } from '@/components/transactions/DateField';
import { TypeToggle } from '@/components/transactions/TypeToggle';
import { getCategoryMeta } from '@/constants/categories';
import { useDeleteTransaction, useUpdateTransaction } from '@/hooks/useTransactions';
import type { TransactionsStackParamList } from '@/navigation/types';
import { useAuthTheme } from '@/theme/authTheme';
import { radius, spacing } from '@/theme/spacing';
import { fontFamily } from '@/theme/typography';
import type { Category, Transaction, TransactionType } from '@/types/transaction';
import { formatCurrency } from '@/utils/formatCurrency';
import { getErrorMessage } from '@/utils/getErrorMessage';

type Props = NativeStackScreenProps<TransactionsStackParamList, 'EditTransaction'>;

export function EditTransactionScreen({ route, navigation }: Props) {
  const { transaction } = route.params;
  // Remount the form when the target transaction changes (e.g. opening a
  // different item via cross-tab navigation) so the fields re-seed correctly.
  return (
    <EditForm key={transaction.id} transaction={transaction} onClose={() => navigation.goBack()} />
  );
}

function EditForm({ transaction, onClose }: { transaction: Transaction; onClose: () => void }) {
  const { c, isDark } = useAuthTheme();
  const update = useUpdateTransaction();
  const remove = useDeleteTransaction();

  const [type, setType] = useState<TransactionType>(transaction.type);
  const [amount, setAmount] = useState(String(transaction.amount));
  const [category, setCategory] = useState<Category>(transaction.category);
  const [note, setNote] = useState(transaction.note ?? '');
  const [date, setDate] = useState<Date>(() => new Date(transaction.date));
  const [shake, setShake] = useState(0);
  const [done, setDone] = useState(false);

  const numeric = Number(amount);
  const amountValid = amount.length > 0 && Number.isFinite(numeric) && numeric > 0;
  const isIncome = type === 'INCOME';
  const accent = isIncome ? c.success : c.primary;
  const meta = getCategoryMeta(category);
  const overlayBg = isDark ? 'rgba(2,6,23,0.82)' : 'rgba(248,250,252,0.86)';

  const handleSave = () => {
    if (!amountValid) {
      setShake((s) => s + 1);
      return;
    }
    update.mutate(
      {
        id: transaction.id,
        payload: {
          type,
          amount: numeric,
          category,
          note: note.trim() || undefined,
          date: date.toISOString(),
        },
      },
      {
        onSuccess: () => {
          setDone(true);
          setTimeout(onClose, 1000);
        },
        onError: (error) => Alert.alert('Could not save', getErrorMessage(error)),
      },
    );
  };

  const handleDelete = () => {
    Alert.alert('Delete transaction', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          remove.mutate(transaction.id, {
            onSuccess: onClose,
            onError: (error) => Alert.alert('Could not delete', getErrorMessage(error)),
          }),
      },
    ]);
  };

  return (
    <AuthLayout center={false} onBack={onClose}>
      <View style={styles.content}>
        <Animated.View entering={FadeIn.duration(450)} style={styles.header}>
          <Text style={[styles.title, { color: c.text }]}>Edit transaction</Text>
          <TypeToggle type={type} onChange={setType} />
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(420).delay(40)}>
          <AmountField
            value={amount}
            onChangeText={setAmount}
            accent={accent}
            shakeSignal={shake}
          />
        </Animated.View>

        <GlassCard delay={90}>
          <View style={styles.form}>
            <View style={styles.section}>
              <Text style={[styles.label, { color: c.textMuted }]}>Category</Text>
              <CategoryChips value={category} onChange={setCategory} />
            </View>

            <FloatingLabelInput
              label="Note (optional)"
              value={note}
              onChangeText={setNote}
              icon={<NoteIcon color={c.inputIcon} />}
              maxLength={200}
            />

            <DateField value={date} onChange={setDate} />
          </View>
        </GlassCard>

        <Animated.View entering={FadeInDown.duration(420).delay(150)} style={styles.actions}>
          <GradientButton title="Save changes" onPress={handleSave} loading={update.isPending} />

          <PressableScale
            onPress={handleDelete}
            disabled={remove.isPending}
            style={[
              styles.deleteBtn,
              { backgroundColor: `${c.danger}1a`, borderColor: `${c.danger}59` },
            ]}
            accessibilityLabel="Delete transaction"
          >
            <TrashIcon size={18} color={c.danger} />
            <Text style={[styles.deleteText, { color: c.danger }]}>Delete transaction</Text>
          </PressableScale>
        </Animated.View>
      </View>

      <Modal visible={done} transparent statusBarTranslucent animationType="fade">
        <View style={[styles.overlay, { backgroundColor: overlayBg }]}>
          <SuccessCheck size={112} />
          <Text style={[styles.overlayTitle, { color: c.text }]}>Changes saved</Text>
          <Text style={[styles.overlaySub, { color: c.textMuted }]}>
            {formatCurrency(amountValid ? numeric : 0)} · {meta.label}
          </Text>
        </View>
      </Modal>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.xl },
  header: { gap: 14 },
  title: { fontSize: 28, fontFamily: fontFamily.bold, letterSpacing: -0.4 },
  form: { gap: 18 },
  section: { gap: 12 },
  label: { fontSize: 14, fontFamily: fontFamily.medium },
  actions: { gap: spacing.md },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  deleteText: { fontSize: 15, fontFamily: fontFamily.semibold },
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xxl,
  },
  overlayTitle: { fontSize: 24, fontFamily: fontFamily.bold, marginTop: spacing.sm },
  overlaySub: { fontSize: 15, fontFamily: fontFamily.medium },
});
