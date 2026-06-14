import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { useTheme } from '@/hooks/useTheme';
import { AnalyticsScreen } from '@/screens/AnalyticsScreen';
import { HomeScreen } from '@/screens/HomeScreen';
import { AddTransactionScreen } from '@/screens/transactions/AddTransactionScreen';

import { BudgetsNavigator } from './BudgetsNavigator';
import { ProfileNavigator } from './ProfileNavigator';
import { TransactionsNavigator } from './TransactionsNavigator';
import type { AppTabParamList } from './types';

const Tab = createBottomTabNavigator<AppTabParamList>();

type IoniconName = keyof typeof Ionicons.glyphMap;
type TabIconProps = { focused: boolean; color: string; size: number };

/** Builds a tab icon that shows the filled glyph when focused, outline otherwise. */
function tabIcon(active: IoniconName, inactive: IoniconName) {
  return function TabBarIcon({ focused, color, size }: TabIconProps) {
    return <Ionicons name={focused ? active : inactive} size={size} color={color} />;
  };
}

const HomeIcon = tabIcon('home', 'home-outline');
const TransactionsIcon = tabIcon('receipt', 'receipt-outline');
const AddIcon = tabIcon('add-circle', 'add-circle-outline');
const BudgetsIcon = tabIcon('wallet', 'wallet-outline');
const AnalyticsIcon = tabIcon('stats-chart', 'stats-chart-outline');
const ProfileIcon = tabIcon('person-circle', 'person-circle-outline');

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
