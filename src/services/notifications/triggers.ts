import { listBudgets } from '@/api/budget.api';
import { getCategoryMeta } from '@/constants/categories';
import { notifyBudgetExceeded, notifyBudgetWarning } from '@/services/appNotifications';
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
 * income → "money received" OS alert (gated by settings); expense → re-check
 * budget thresholds (always — the in-app budget notification is unconditional;
 * the OS push inside is what's gated). Fire-and-forget.
 */
export function onTransactionCreated(tx: Transaction): void {
  const settings = useSettingsStore.getState();

  if (tx.type === 'INCOME' && settings.notifMoneyIn) {
    void notifyMoneyIn(tx.amount, tx.note);
  }

  if (tx.type === 'EXPENSE') {
    void runBudgetAlertCheck();
  }
}

/**
 * Fetches the current month's budgets and, for any that have newly crossed the
 * 80% (warning) or 100% (exceeded) threshold, raises an in-app notification
 * (always) and an OS push (only when the user enabled it). Deduped once per
 * threshold via `notifiedBudgetsStore`.
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
  const osEnabled = useSettingsStore.getState().notifBudgetAlerts;
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
    const dedupeKey = `budget-${key}-${budget.status}`;

    // In-app notification (always).
    if (exceeded) notifyBudgetExceeded(name, dedupeKey);
    else notifyBudgetWarning(name, percent, dedupeKey);

    // OS push (only when enabled).
    if (osEnabled) {
      await notifyBudgetAlert(
        exceeded ? '🚨 Budget exceeded' : '⚠️ Budget alert',
        exceeded
          ? `You've gone over your ${name} budget (${percent}% used).`
          : `You've used ${percent}% of your ${name} budget.`,
      );
    }
    store.markNotified(key, budget.status);
  }
}
