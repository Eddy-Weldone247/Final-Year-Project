import { Prisma } from '@prisma/client';

import { prisma } from '../config/prisma';
import { AppError } from '../middleware/errorHandler';
import type { CreateBudgetInput } from '../validators/budget.schema';

/** Budgets alert at 80% (warning) and 100% (exceeded). */
const WARNING_THRESHOLD = 80;

export type BudgetStatus = 'ok' | 'warning' | 'exceeded';

export interface BudgetProgress {
  id: string;
  category: string | null; // null = overall monthly budget
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

interface BudgetRow {
  id: string;
  month: string;
  category: string | null;
  amount: Prisma.Decimal;
}

/** Current month as "YYYY-MM" (UTC). */
function currentMonth(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** [start, end) Date range for a "YYYY-MM" month (UTC). */
function monthRange(month: string): { start: Date; end: Date } {
  const year = Number(month.slice(0, 4));
  const monthIndex = Number(month.slice(5, 7)) - 1;
  return {
    start: new Date(Date.UTC(year, monthIndex, 1)),
    end: new Date(Date.UTC(year, monthIndex + 1, 1)),
  };
}

function computeProgress(budget: BudgetRow, spent: number): BudgetProgress {
  const amount = Number(budget.amount);
  const percent = amount > 0 ? Math.round((spent / amount) * 100) : 0;
  const status: BudgetStatus =
    percent >= 100 ? 'exceeded' : percent >= WARNING_THRESHOLD ? 'warning' : 'ok';
  return {
    id: budget.id,
    category: budget.category,
    amount,
    spent,
    remaining: amount - spent,
    percent,
    status,
  };
}

export async function createBudget(
  userId: string,
  { month, category, amount }: CreateBudgetInput,
): Promise<{ id: string; month: string; category: string | null; amount: number }> {
  const existing = await prisma.budget.findFirst({
    where: { userId, month, category: category ?? null },
  });
  if (existing) {
    throw new AppError(
      409,
      category
        ? 'A budget for this category and month already exists'
        : 'An overall budget for this month already exists',
    );
  }

  const budget = await prisma.budget.create({
    data: { userId, month, category: category ?? null, amount: new Prisma.Decimal(amount) },
  });
  return {
    id: budget.id,
    month: budget.month,
    category: budget.category,
    amount: Number(budget.amount),
  };
}

export async function updateBudget(
  userId: string,
  id: string,
  amount: number,
): Promise<{ id: string; month: string; category: string | null; amount: number }> {
  const existing = await prisma.budget.findFirst({ where: { id, userId } });
  if (!existing) {
    throw new AppError(404, 'Budget not found');
  }
  const budget = await prisma.budget.update({
    where: { id },
    data: { amount: new Prisma.Decimal(amount) },
  });
  return {
    id: budget.id,
    month: budget.month,
    category: budget.category,
    amount: Number(budget.amount),
  };
}

export async function deleteBudget(userId: string, id: string): Promise<void> {
  const result = await prisma.budget.deleteMany({ where: { id, userId } });
  if (result.count === 0) {
    throw new AppError(404, 'Budget not found');
  }
}

/** Returns budgets for a month with spend, percentage, and alert status. */
export async function getBudgets(userId: string, month?: string): Promise<BudgetsOverview> {
  const resolvedMonth = month ?? currentMonth();
  const { start, end } = monthRange(resolvedMonth);

  const [budgets, grouped] = await Promise.all([
    prisma.budget.findMany({ where: { userId, month: resolvedMonth } }),
    prisma.transaction.groupBy({
      by: ['category'],
      where: { userId, type: 'EXPENSE', date: { gte: start, lt: end } },
      _sum: { amount: true },
    }),
  ]);

  const spentByCategory = new Map<string, number>();
  let totalSpent = 0;
  for (const group of grouped) {
    const sum = Number(group._sum.amount ?? 0);
    spentByCategory.set(group.category, sum);
    totalSpent += sum;
  }

  const overall = budgets.find((b) => b.category === null);
  const categories = budgets.filter((b) => b.category !== null);

  return {
    month: resolvedMonth,
    overall: overall ? computeProgress(overall, totalSpent) : null,
    categories: categories
      .map((b) => computeProgress(b, spentByCategory.get(b.category as string) ?? 0))
      .sort((a, b) => b.percent - a.percent),
  };
}
