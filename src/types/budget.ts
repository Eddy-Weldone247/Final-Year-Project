import type { Category } from './transaction';

export type BudgetStatus = 'ok' | 'warning' | 'exceeded';

export interface BudgetProgress {
  id: string;
  category: Category | null; // null = overall monthly budget
  amount: number;
  spent: number;
  remaining: number;
  percent: number;
  status: BudgetStatus;
}

export interface BudgetsOverview {
  month: string;
  overall: BudgetProgress | null;
  categories: BudgetProgress[];
}

export interface CreateBudgetPayload {
  month: string;
  category?: Category | null;
  amount: number;
}

export interface UpdateBudgetPayload {
  amount: number;
}
