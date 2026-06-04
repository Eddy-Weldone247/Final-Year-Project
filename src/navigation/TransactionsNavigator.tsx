import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { EditTransactionScreen } from '@/screens/transactions/EditTransactionScreen';
import { ImportSmsScreen } from '@/screens/transactions/ImportSmsScreen';
import { TransactionListScreen } from '@/screens/transactions/TransactionListScreen';

import type { TransactionsStackParamList } from './types';

const Stack = createNativeStackNavigator<TransactionsStackParamList>();

export function TransactionsNavigator() {
  const { colors } = useTheme();
  return (
    <Stack.Navigator screenOptions={{ headerShadowVisible: false }}>
      <Stack.Screen
        name="TransactionList"
        component={TransactionListScreen}
        options={({ navigation }) => ({
          title: 'Transactions',
          headerRight: () => (
            <Pressable onPress={() => navigation.navigate('ImportSms')} accessibilityRole="button">
              <Text style={[styles.headerAction, { color: colors.primary }]}>Import</Text>
            </Pressable>
          ),
        })}
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

const styles = StyleSheet.create({
  headerAction: { fontSize: 16, fontWeight: '600' },
});
