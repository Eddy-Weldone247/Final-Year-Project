import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { BudgetStatus } from '@/types/budget';

const RANK: Record<BudgetStatus, number> = { ok: 0, warning: 1, exceeded: 2 };

interface NotifiedBudgetsState {
  /** key = `${month}:${budgetId}` → highest status already notified. */
  notified: Record<string, BudgetStatus>;
  /** True when `status` is an escalation past what was last notified for `key`. */
  shouldNotify: (key: string, status: BudgetStatus) => boolean;
  markNotified: (key: string, status: BudgetStatus) => void;
}

/**
 * Tracks which budget thresholds have already triggered a notification, so an
 * over-budget category alerts once (and again only if it escalates), not on
 * every subsequent expense. Persisted; keys embed the month so it self-resets.
 */
export const useNotifiedBudgetsStore = create<NotifiedBudgetsState>()(
  persist(
    (set, get) => ({
      notified: {},
      shouldNotify: (key, status) => {
        if (status === 'ok') return false;
        const last = get().notified[key] ?? 'ok';
        return RANK[status] > RANK[last];
      },
      markNotified: (key, status) =>
        set((state) => ({ notified: { ...state.notified, [key]: status } })),
    }),
    {
      name: 'expensee-notified-budgets',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
