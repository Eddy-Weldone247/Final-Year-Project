import type { Category } from './transaction';

export interface CategoryTotal {
  category: Category;
  total: number;
}
export interface MonthlyTotal {
  month: string; // "YYYY-MM"
  income: number;
  expense: number;
}
export interface DailyTotal {
  date: string; // "YYYY-MM-DD"
  income: number;
  expense: number;
}

export interface DashboardStats {
  summary: { income: number; expense: number; balance: number; count: number };
  byCategory: CategoryTotal[];
  monthly: MonthlyTotal[];
  daily: DailyTotal[];
}
