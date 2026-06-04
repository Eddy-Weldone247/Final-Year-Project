import { prisma } from '../config/prisma';

export interface CategoryTotal {
  category: string;
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
  byCategory: CategoryTotal[]; // all-time expense by category, desc
  monthly: MonthlyTotal[]; // last 6 months incl. current
  daily: DailyTotal[]; // current month, by day
}

function monthKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** Aggregates all dashboard chart data for a user in a few queries. */
export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  const sixStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1));

  const [summaryGrouped, categoryGrouped, windowTxns] = await Promise.all([
    prisma.transaction.groupBy({
      by: ['type'],
      where: { userId },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.transaction.groupBy({
      by: ['category'],
      where: { userId, type: 'EXPENSE' },
      _sum: { amount: true },
    }),
    prisma.transaction.findMany({
      where: { userId, date: { gte: sixStart, lt: monthEnd } },
      select: { type: true, amount: true, date: true },
    }),
  ]);

  // All-time summary.
  let income = 0;
  let expense = 0;
  let count = 0;
  for (const g of summaryGrouped) {
    const sum = Number(g._sum.amount ?? 0);
    count += g._count._all;
    if (g.type === 'INCOME') income = sum;
    else expense = sum;
  }

  // All-time expense by category.
  const byCategory = categoryGrouped
    .map((g) => ({ category: g.category, total: Number(g._sum.amount ?? 0) }))
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total);

  // Pre-seed the last 6 month buckets so empty months still appear.
  const monthly = new Map<string, MonthlyTotal>();
  for (let i = 0; i < 6; i += 1) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5 + i, 1));
    monthly.set(monthKey(d), { month: monthKey(d), income: 0, expense: 0 });
  }

  const daily = new Map<string, DailyTotal>();
  for (const t of windowTxns) {
    const d = new Date(t.date);
    const amount = Number(t.amount);
    const mk = monthKey(d);

    const mBucket = monthly.get(mk);
    if (mBucket) {
      if (t.type === 'INCOME') mBucket.income += amount;
      else mBucket.expense += amount;
    }

    if (t.date >= monthStart && t.date < monthEnd) {
      const dk = `${mk}-${String(d.getUTCDate()).padStart(2, '0')}`;
      const dBucket = daily.get(dk) ?? { date: dk, income: 0, expense: 0 };
      if (t.type === 'INCOME') dBucket.income += amount;
      else dBucket.expense += amount;
      daily.set(dk, dBucket);
    }
  }

  return {
    summary: { income, expense, balance: income - expense, count },
    byCategory,
    monthly: [...monthly.values()],
    daily: [...daily.values()].sort((a, b) => a.date.localeCompare(b.date)),
  };
}
