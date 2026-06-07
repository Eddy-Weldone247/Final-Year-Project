import type { NavigatorScreenParams } from '@react-navigation/native';

import type { Category, Transaction, TransactionType } from '@/types/transaction';

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token?: string };
  VerifyEmail: { email?: string };
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
  EditProfile: undefined;
  ChangePassword: undefined;
  Settings: undefined;
};

export type TransactionsStackParamList = {
  TransactionList: undefined;
  EditTransaction: { transaction: Transaction };
  ImportSms: undefined;
};

export type BudgetsStackParamList = {
  BudgetOverview: undefined;
  BudgetForm: {
    scope: 'overall' | Category;
    month: string;
    label: string;
    budgetId?: string;
    currentAmount?: number;
  };
};

export type AppTabParamList = {
  Home: undefined;
  Transactions: NavigatorScreenParams<TransactionsStackParamList>;
  Add: { type?: TransactionType } | undefined;
  Budgets: NavigatorScreenParams<BudgetsStackParamList>;
  Analytics: undefined;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  App: NavigatorScreenParams<AppTabParamList>;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootStackParamList {}
  }
}
