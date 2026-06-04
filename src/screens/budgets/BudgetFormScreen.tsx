import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { FadeInView } from '@/components/FadeInView';
import { ScreenContainer } from '@/components/ScreenContainer';
import { TextField } from '@/components/TextField';
import { useCreateBudget, useDeleteBudget, useUpdateBudget } from '@/hooks/useBudgets';
import { useTheme } from '@/hooks/useTheme';
import type { BudgetsStackParamList } from '@/navigation/types';
import { formatMonth } from '@/utils/month';
import { getErrorMessage } from '@/utils/getErrorMessage';

type Props = NativeStackScreenProps<BudgetsStackParamList, 'BudgetForm'>;

export function BudgetFormScreen({ route, navigation }: Props) {
  const { colors } = useTheme();
  const { scope, month, label, budgetId, currentAmount } = route.params;
  const [amount, setAmount] = useState(currentAmount != null ? String(currentAmount) : '');

  const create = useCreateBudget();
  const update = useUpdateBudget();
  const remove = useDeleteBudget();

  const isEditing = !!budgetId;
  const numeric = Number(amount);
  const canSubmit = amount.length > 0 && Number.isFinite(numeric) && numeric > 0;
  const submitting = create.isPending || update.isPending;

  const onError = (error: unknown) => Alert.alert('Could not save budget', getErrorMessage(error));

  const handleSave = () => {
    if (isEditing) {
      update.mutate(
        { id: budgetId, payload: { amount: numeric } },
        { onSuccess: () => navigation.goBack(), onError },
      );
    } else {
      create.mutate(
        { month, category: scope === 'overall' ? null : scope, amount: numeric },
        { onSuccess: () => navigation.goBack(), onError },
      );
    }
  };

  const handleDelete = () => {
    if (!budgetId) return;
    Alert.alert('Delete budget', 'Remove this budget?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          remove.mutate(budgetId, {
            onSuccess: () => navigation.goBack(),
            onError: (error) => Alert.alert('Could not delete', getErrorMessage(error)),
          }),
      },
    ]);
  };

  return (
    <ScreenContainer>
      <FadeInView style={styles.form}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>{label}</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>{formatMonth(month)}</Text>
        </View>

        <TextField
          label="Monthly budget amount"
          value={amount}
          onChangeText={setAmount}
          placeholder="0.00"
          keyboardType="decimal-pad"
        />

        <Button
          title={isEditing ? 'Save budget' : 'Set budget'}
          onPress={handleSave}
          loading={submitting}
          disabled={!canSubmit}
        />
        {isEditing ? (
          <Button
            title="Delete budget"
            variant="danger"
            onPress={handleDelete}
            loading={remove.isPending}
          />
        ) : null}
      </FadeInView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  form: { gap: 16 },
  header: { gap: 6, marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '700' },
  subtitle: { fontSize: 15 },
});
