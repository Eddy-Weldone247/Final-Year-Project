import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { Alert, StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { FadeInView } from '@/components/FadeInView';
import { ScreenContainer } from '@/components/ScreenContainer';
import { TransactionForm, type TransactionFormPayload } from '@/components/TransactionForm';
import { useDeleteTransaction, useUpdateTransaction } from '@/hooks/useTransactions';
import type { TransactionsStackParamList } from '@/navigation/types';
import { getErrorMessage } from '@/utils/getErrorMessage';

type Props = NativeStackScreenProps<TransactionsStackParamList, 'EditTransaction'>;

export function EditTransactionScreen({ route, navigation }: Props) {
  const { transaction } = route.params;
  const update = useUpdateTransaction();
  const remove = useDeleteTransaction();

  const handleSubmit = (payload: TransactionFormPayload) => {
    update.mutate(
      { id: transaction.id, payload },
      {
        onSuccess: () => navigation.goBack(),
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
            onSuccess: () => navigation.goBack(),
            onError: (error) => Alert.alert('Could not delete', getErrorMessage(error)),
          }),
      },
    ]);
  };

  return (
    <ScreenContainer center={false}>
      <FadeInView>
        <TransactionForm
          initial={transaction}
          submitLabel="Save changes"
          submitting={update.isPending}
          onSubmit={handleSubmit}
        />
        <View style={styles.deleteWrap}>
          <Button
            title="Delete"
            variant="danger"
            onPress={handleDelete}
            loading={remove.isPending}
          />
        </View>
      </FadeInView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  deleteWrap: { marginTop: 16 },
});
