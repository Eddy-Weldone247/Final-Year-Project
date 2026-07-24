import { getCategoryMeta } from '@/constants/categories';
import { type NewNotification, useNotificationsStore } from '@/store/notificationsStore';
import type { SmsProvider } from '@/services/sms/types';
import type { Category } from '@/types/transaction';
import { formatCurrency } from '@/utils/formatCurrency';
import { currentMonth } from '@/utils/month';

/**
 * In-app notification generators — thin functions that translate an existing app
 * event into a stored notification. Called imperatively from event sites (no
 * background service). Reuses existing utilities (currency/category formatting).
 */
function raise(n: NewNotification): void {
  useNotificationsStore.getState().add(n);
}

/** 1. New account created. */
export function notifyWelcome(): void {
  raise({
    kind: 'welcome',
    title: 'Welcome to EXPENSEE',
    message:
      'Thank you for joining EXPENSEE. Start tracking your expenses and achieve your financial goals.',
  });
}

/** 2. A manual expense was recorded. */
export function notifyExpenseRecorded(amount: number, category: Category): void {
  raise({
    kind: 'expense',
    title: 'Expense Recorded',
    message: `${formatCurrency(amount)} was added to ${getCategoryMeta(category).label}.`,
  });
}

/** 3. A financial SMS was successfully imported. */
export function notifySmsImported(provider: SmsProvider): void {
  const label = provider === 'Bank' ? 'bank' : 'Mobile Money';
  raise({
    kind: 'sms',
    title: 'SMS Transaction Imported',
    message: `A ${label} transaction has been added successfully.`,
  });
}

/** 4a. A budget reached/exceeded 80% (warning). Deduped once per threshold. */
export function notifyBudgetWarning(name: string, percent: number, dedupeKey: string): void {
  raise({
    kind: 'budget-warning',
    title: 'Budget Reminder',
    message: `You have used ${percent}% of your ${name} budget.`,
    dedupeKey,
  });
}

/** 4b. A budget exceeded 100%. Deduped once per threshold. */
export function notifyBudgetExceeded(name: string, dedupeKey: string): void {
  raise({
    kind: 'budget-exceeded',
    title: 'Budget Exceeded',
    message: `Your ${name} budget has been exceeded.`,
    dedupeKey,
  });
}

/** 5. The Linear Regression spending prediction completed. Once per month. */
export function notifyPredictionReady(): void {
  raise({
    kind: 'prediction',
    title: 'Spending Prediction Ready',
    message: 'Your latest monthly spending prediction is now available.',
    dedupeKey: `prediction-${currentMonth()}`,
  });
}

/** 6. The monthly financial summary is available. Once per month. */
export function notifyMonthlySummary(): void {
  raise({
    kind: 'summary',
    title: 'Monthly Summary',
    message: 'Your monthly spending report is now available.',
    dedupeKey: `summary-${currentMonth()}`,
  });
}
