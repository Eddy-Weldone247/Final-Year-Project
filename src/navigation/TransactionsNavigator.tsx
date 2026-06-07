import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { EditTransactionScreen } from '@/screens/transactions/EditTransactionScreen';
import { ImportSmsScreen } from '@/screens/transactions/ImportSmsScreen';
import { TransactionListScreen } from '@/screens/transactions/TransactionListScreen';

import type { TransactionsStackParamList } from './types';

const Stack = createNativeStackNavigator<TransactionsStackParamList>();

export function TransactionsNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShadowVisible: false }}>
      {/* Headerless — the screen renders its own glass header (with the Import action). */}
      <Stack.Screen
        name="TransactionList"
        component={TransactionListScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="EditTransaction"
        component={EditTransactionScreen}
        options={{ title: 'Edit Transaction' }}
      />
      <Stack.Screen
        name="ImportSms"
        component={ImportSmsScreen}
        options={{ title: 'Import from SMS' }}
      />
    </Stack.Navigator>
  );
}
