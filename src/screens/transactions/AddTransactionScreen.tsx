import { type BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { FadeInView } from '@/components/FadeInView';
import { ScreenContainer } from '@/components/ScreenContainer';
import { TransactionForm, type TransactionFormPayload } from '@/components/TransactionForm';
import { useTheme } from '@/hooks/useTheme';
import { useCreateTransaction } from '@/hooks/useTransactions';
import type { AppTabParamList } from '@/navigation/types';
import { getErrorMessage } from '@/utils/getErrorMessage';

type Props = BottomTabScreenProps<AppTabParamList, 'Add'>;

export function AddTransactionScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const create = useCreateTransaction();
  // Remount the form after a successful add to clear its fields.
  const [formKey, setFormKey] = useState(0);

  const handleSubmit = (payload: TransactionFormPayload) => {
    create.mutate(payload, {
      onSuccess: () => {
        setFormKey((k) => k + 1);
        navigation.navigate('Transactions', { screen: 'TransactionList' });
      },
      onError: (error) => Alert.alert('Could not add transaction', getErrorMessage(error)),
    });
  };

  return (
    <ScreenContainer center={false}>
      <FadeInView style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Add transaction</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Record an income or expense
          </Text>
        </View>
        <TransactionForm
          key={formKey}
          submitLabel="Add transaction"
          submitting={create.isPending}
          onSubmit={handleSubmit}
        />
      </FadeInView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { gap: 16 },
  header: { gap: 6, marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '700' },
  subtitle: { fontSize: 15 },
});
