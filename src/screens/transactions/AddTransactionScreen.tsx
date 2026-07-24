import { type BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedBackground } from '@/components/animations/AnimatedBackground';
import { SuccessCheck } from '@/components/animations/SuccessCheck';
import { GradientButton } from '@/components/buttons/GradientButton';
import { GlassCard } from '@/components/cards/GlassCard';
import { NoteIcon, TagIcon } from '@/components/icons';
import { FloatingLabelInput } from '@/components/inputs/FloatingLabelInput';
import { AmountField } from '@/components/transactions/AmountField';
import { CategoryChips } from '@/components/transactions/CategoryChips';
import { DateField } from '@/components/transactions/DateField';
import { TypeToggle } from '@/components/transactions/TypeToggle';
import { getCategoryMeta } from '@/constants/categories';
import { useCreateTransaction } from '@/hooks/useTransactions';
import type { AppTabParamList } from '@/navigation/types';
import { notifyExpenseRecorded } from '@/services/appNotifications';
import { useAuthTheme } from '@/theme/authTheme';
import { fontFamily } from '@/theme/typography';
import type { Category, TransactionType } from '@/types/transaction';
import { formatCurrency } from '@/utils/formatCurrency';
import { getErrorMessage } from '@/utils/getErrorMessage';

type Props = BottomTabScreenProps<AppTabParamList, 'Add'>;

export function AddTransactionScreen({ navigation, route }: Props) {
  const { c } = useAuthTheme();
  const create = useCreateTransaction();
  const presetType = route.params?.type;

  const [type, setType] = useState<TransactionType>(presetType ?? 'EXPENSE');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category>('FOOD');
  const [merchant, setMerchant] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState<Date>(() => new Date());
  const [shake, setShake] = useState(0);
  const [done, setDone] = useState(false);

  // Honour a preset type from a quick action, even if the tab is already mounted.
  useEffect(() => {
    if (presetType) setType(presetType);
  }, [presetType]);

  const numeric = Number(amount);
  const amountValid = amount.length > 0 && Number.isFinite(numeric) && numeric > 0;
  const isIncome = type === 'INCOME';
  const accent = isIncome ? c.success : c.primary;

  const submit = () => {
    if (!amountValid) {
      setShake((s) => s + 1);
      return;
    }
    const note = [merchant.trim(), notes.trim()].filter(Boolean).join(' — ') || undefined;
    create.mutate(
      { type, amount: numeric, category, note, date: date.toISOString() },
      {
        onSuccess: () => {
          if (type === 'EXPENSE') notifyExpenseRecorded(numeric, category);
          setDone(true);
          setTimeout(() => {
            setDone(false);
            setAmount('');
            setMerchant('');
            setNotes('');
            setCategory('FOOD');
            setDate(new Date());
            navigation.navigate('Transactions', { screen: 'TransactionList' });
          }, 1100);
        },
        onError: (error) => Alert.alert('Could not add transaction', getErrorMessage(error)),
      },
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: c.gradient[0] }]}>
      <AnimatedBackground />
      <SafeAreaView style={styles.fill} edges={['top']}>
        <KeyboardAvoidingView
          style={styles.fill}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Animated.View entering={FadeIn.duration(450)} style={styles.header}>
              <Text style={[styles.title, { color: c.text }]}>
                {isIncome ? 'Add income' : 'Add expense'}
              </Text>
              <TypeToggle type={type} onChange={setType} />
            </Animated.View>

            <AmountField
              value={amount}
              onChangeText={setAmount}
              accent={accent}
              shakeSignal={shake}
            />

            <GlassCard delay={80}>
              <View style={styles.form}>
                <View style={styles.section}>
                  <Text style={[styles.label, { color: c.textMuted }]}>Category</Text>
                  <CategoryChips value={category} onChange={setCategory} />
                </View>

                <FloatingLabelInput
                  label="Merchant"
                  value={merchant}
                  onChangeText={setMerchant}
                  icon={<TagIcon color={c.inputIcon} />}
                  autoCapitalize="words"
                  maxLength={60}
                  success={merchant.trim().length > 0}
                />

                <FloatingLabelInput
                  label="Notes (optional)"
                  value={notes}
                  onChangeText={setNotes}
                  icon={<NoteIcon color={c.inputIcon} />}
                  maxLength={200}
                />

                <DateField value={date} onChange={setDate} />
              </View>
            </GlassCard>

            <GradientButton
              title={isIncome ? 'Add income' : 'Add expense'}
              onPress={submit}
              loading={create.isPending}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {done ? (
        <Animated.View entering={FadeIn.duration(220)} style={styles.overlay}>
          <BlurView
            intensity={c.blurIntensity + 20}
            tint={c.blurTint}
            experimentalBlurMethod="dimezisBlurView"
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.overlayInner}>
            <SuccessCheck size={108} />
            <Text style={[styles.overlayTitle, { color: c.text }]}>
              {isIncome ? 'Income added' : 'Expense added'}
            </Text>
            <Text style={[styles.overlaySub, { color: c.textMuted }]}>
              {formatCurrency(numeric)} · {getCategoryMeta(category).label}
            </Text>
          </View>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  fill: { flex: 1 },
  content: { padding: 20, paddingBottom: 32, gap: 20 },
  header: { gap: 14 },
  title: { fontSize: 28, fontFamily: fontFamily.bold, letterSpacing: -0.4 },
  form: { gap: 18 },
  section: { gap: 12 },
  label: { fontSize: 14, fontFamily: fontFamily.medium },
  overlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  overlayInner: { alignItems: 'center', gap: 12, paddingHorizontal: 24 },
  overlayTitle: { fontSize: 24, fontFamily: fontFamily.bold, marginTop: 8 },
  overlaySub: { fontSize: 15, fontFamily: fontFamily.medium },
});
