import { Category } from '@prisma/client';

import { prisma } from '../config/prisma';

/** Aggregate spending/earning figures for a single category, platform-wide. */
export interface CategoryStat {
  category: string;
  income: number; // total INCOME amount in this category
  expense: number; // total EXPENSE amount in this category
  total: number; // gross volume (income + expense)
  count: number; // number of transactions in this category
}

/** Platform-wide metrics for the admin dashboard. */
export interface AdminStats {
  totalUsers: number;
  totalTransactions: number;
  totalIncome: number;
  totalExpenses: number;
  netBalance: number; // totalIncome - totalExpenses
  categories: CategoryStat[]; // every category, sorted by expense desc
}

/**
 * Computes platform-wide totals and per-category statistics across *all* users.
 * Admin-only — see `requireAdmin`.
 */
export async function getStats(): Promise<AdminStats> {
  const [totalUsers, totalTransactions, byType, byCategory] = await Promise.all([
    prisma.user.count(),
    prisma.transaction.count(),
    prisma.transaction.groupBy({ by: ['type'], _sum: { amount: true } }),
    prisma.transaction.groupBy({
      by: ['category', 'type'],
      _sum: { amount: true },
      _count: { _all: true },
    }),
  ]);

  let totalIncome = 0;
  let totalExpenses = 0;
  for (const group of byType) {
    const sum = Number(group._sum.amount ?? 0);
    if (group.type === 'INCOME') totalIncome = sum;
    else totalExpenses = sum;
  }

  // Pre-seed every category so categories with no transactions still appear.
  const categories = new Map<string, CategoryStat>();
  for (const category of Object.values(Category)) {
    categories.set(category, { category, income: 0, expense: 0, total: 0, count: 0 });
  }
  for (const group of byCategory) {
    const stat = categories.get(group.category);
    if (!stat) continue;
    const sum = Number(group._sum.amount ?? 0);
    stat.count += group._count._all;
    if (group.type === 'INCOME') stat.income += sum;
    else stat.expense += sum;
    stat.total = stat.income + stat.expense;
  }

  return {
    totalUsers,
    totalTransactions,
    totalIncome,
    totalExpenses,
    netBalance: totalIncome - totalExpenses,
    categories: [...categories.values()].sort((a, b) => b.expense - a.expense),
  };
}

export interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  isEmailVerified: boolean;
  transactionCount: number;
  createdAt: Date;
}

export interface AdminUserPage {
  items: AdminUserRow[];
  total: number;
  page: number;
  limit: number;
}

/** Paginated list of all users (admin-only), newest first. */
export async function listUsers(page: number, limit: number): Promise<AdminUserPage> {
  const [rows, total] = await prisma.$transaction([
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isEmailVerified: true,
        createdAt: true,
        _count: { select: { transactions: true } },
      },
    }),
    prisma.user.count(),
  ]);

  return {
    items: rows.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      isEmailVerified: u.isEmailVerified,
      transactionCount: u._count.transactions,
      createdAt: u.createdAt,
    })),
    total,
    page,
    limit,
  };
}
