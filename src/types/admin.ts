import type { Role } from './auth';
import type { Category } from './transaction';

/** Platform-wide spending/earning figures for a single category. */
export interface AdminCategoryStat {
  category: Category;
  income: number;
  expense: number;
  total: number;
  count: number;
}

/** Platform-wide metrics returned by `GET /admin/stats`. */
export interface AdminStats {
  totalUsers: number;
  totalTransactions: number;
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  categories: AdminCategoryStat[];
}

export interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  role: Role;
  isEmailVerified: boolean;
  transactionCount: number;
  createdAt: string;
}

export interface AdminUserPage {
  items: AdminUserRow[];
  total: number;
  page: number;
  limit: number;
}
