import { listBudgets } from '@/api/budget.api';
import { getCategoryMeta } from '@/constants/categories';
import { useNotifiedBudgetsStore } from '@/store/notifiedBudgetsStore';
import { useSettingsStore } from '@/store/settingsStore';
import type { BudgetProgress } from '@/types/budget';
import type { Transaction } from '@/types/transaction';

import { notifyBudgetAlert, notifyMoneyIn } from './notifications';

/** Current month as the `YYYY-MM` key the budgets API expects. */
function currentMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Reacts to a newly created transaction (manual add or SMS auto-capture):
 * income → "money received" alert; expense → re-check budget thresholds.
 * All gated by the user's notification settings. Fire-and-forget.
 */
export function onTransactionCreated(tx: Transaction): void {
  const settings = useSettingsStore.getState();

  if (tx.type === 'INCOME' && settings.notifMoneyIn) {
    void notifyMoneyIn(tx.amount, tx.note);
  }

  if (tx.type === 'EXPENSE' && settings.notifBudgetAlerts) {
    void runBudgetAlertCheck();
  }
}

/**
 * Fetches the current month's budgets and notifies for any that have newly
 * crossed the warning/exceeded threshold (deduped via `notifiedBudgetsStore`).
 */
export async function runBudgetAlertCheck(): Promise<void> {
  const month = currentMonthKey();

  let overview;
  try {
    overview = await listBudgets(month);
  } catch {
    return; // offline / no budgets — skip
  }

  const store = useNotifiedBudgetsStore.getState();
  const budgets: BudgetProgress[] = [
    ...(overview.overall ? [overview.overall] : []),
    ...overview.categories,
  ];

  for (const budget of budgets) {
    const key = `${month}:${budget.id}`;
    if (!store.shouldNotify(key, budget.status)) continue;

    const name = budget.category ? getCategoryMeta(budget.category).label : 'overall';
    const percent = Math.round(budget.percent);
    const exceeded = budget.status === 'exceeded';
    await notifyBudgetAlert(
      exceeded ? '🚨 Budget exceeded' : '⚠️ Budget alert',
      exceeded
        ? `You've gone over your ${name} budget (${percent}% used).`
        : `You've used ${percent}% of your ${name} budget.`,
    );
    store.markNotified(key, budget.status);
  }
}
