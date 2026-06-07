import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, Text } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { AnalyticsScreen } from '@/screens/AnalyticsScreen';
import { HomeScreen } from '@/screens/HomeScreen';
import { AddTransactionScreen } from '@/screens/transactions/AddTransactionScreen';

import { BudgetsNavigator } from './BudgetsNavigator';
import { ProfileNavigator } from './ProfileNavigator';
import { TransactionsNavigator } from './TransactionsNavigator';
import type { AppTabParamList } from './types';

const Tab = createBottomTabNavigator<AppTabParamList>();

function HomeIcon() {
  return <Text style={styles.icon}>🏠</Text>;
}
function TransactionsIcon() {
  return <Text style={styles.icon}>📒</Text>;
}
function AddIcon() {
  return <Text style={styles.icon}>➕</Text>;
}
function BudgetsIcon() {
  return <Text style={styles.icon}>🎯</Text>;
}
function AnalyticsIcon() {
  return <Text style={styles.icon}>📊</Text>;
}
function ProfileIcon() {
  return <Text style={styles.icon}>👤</Text>;
}

/** Authenticated bottom-tab navigation. */
export function AppNavigator() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarIcon: HomeIcon }} />
      <Tab.Screen
        name="Transactions"
        component={TransactionsNavigator}
        options={{ tabBarIcon: TransactionsIcon }}
      />
      <Tab.Screen name="Add" component={AddTransactionScreen} options={{ tabBarIcon: AddIcon }} />
      <Tab.Screen
        name="Budgets"
        component={BudgetsNavigator}
        options={{ tabBarIcon: BudgetsIcon }}
      />
      <Tab.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{ tabBarIcon: AnalyticsIcon }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileNavigator}
        options={{ tabBarIcon: ProfileIcon }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  icon: { fontSize: 18 },
});
