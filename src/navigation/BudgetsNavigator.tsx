import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { BudgetFormScreen } from '@/screens/budgets/BudgetFormScreen';
import { BudgetOverviewScreen } from '@/screens/budgets/BudgetOverviewScreen';

import type { BudgetsStackParamList } from './types';

const Stack = createNativeStackNavigator<BudgetsStackParamList>();

export function BudgetsNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShadowVisible: false }}>
      <Stack.Screen
        name="BudgetOverview"
        component={BudgetOverviewScreen}
        options={{ headerShown: false }}
      />
      {/* Headerless — renders its own glass shell (AuthLayout) with a back pill. */}
      <Stack.Screen
        name="BudgetForm"
        component={BudgetFormScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
