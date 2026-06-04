import { Prisma } from '@prisma/client';

import { prisma } from '../config/prisma';
import { AppError } from '../middleware/errorHandler';
import type {
  CreateTransactionInput,
  ListTransactionsInput,
  SummaryInput,
  UpdateTransactionInput,
} from '../validators/transaction.schema';

type TransactionRow = Prisma.TransactionGetPayload<object>;

export interface PublicTransaction {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  category: string;
  note: string | null;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

/** Converts a Prisma row (Decimal amount) into a JSON-friendly shape. */
function serialize(t: TransactionRow): PublicTransaction {
  return {
    id: t.id,
    type: t.type,
    amount: Number(t.amount),
    category: t.category,
    note: t.note,
    date: t.date,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  };
}

/** Builds the Prisma `where` filter shared by list and summary queries. */
function buildWhere(
  userId: string,
  filters: Partial<ListTransactionsInput>,
): Prisma.TransactionWhereInput {
  const where: Prisma.TransactionWhereInput = { userId };

  if (filters.type) where.type = filters.type;
  if (filters.category) where.category = filters.category;
  if (filters.search) where.note = { contains: filters.search, mode: 'insensitive' };

  if (filters.startDate || filters.endDate) {
    const dateFilter: Prisma.DateTimeFilter = {};
    if (filters.startDate) dateFilter.gte = filters.startDate;
    if (filters.endDate) dateFilter.lte = filters.endDate;
    where.date = dateFilter;
  }

  if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
    const amountFilter: Prisma.DecimalFilter = {};
    if (filters.minAmount !== undefined) amountFilter.gte = filters.minAmount;
    if (filters.maxAmount !== undefined) amountFilter.lte = filters.maxAmount;
    where.amount = amountFilter;
  }

  return where;
}

export async function createTransaction(
  userId: string,
  data: CreateTransactionInput,
): Promise<PublicTransaction> {
  const created = await prisma.transaction.create({
    data: {
      userId,
      type: data.type,
      amount: new Prisma.Decimal(data.amount),
      category: data.category,
      note: data.note,
      date: data.date ?? new Date(),
    },
  });
  return serialize(created);
}

export interface TransactionPage {
  items: PublicTransaction[];
  total: number;
  page: number;
  limit: number;
}

export async function getTransactions(
  userId: string,
  filters: ListTransactionsInput,
): Promise<TransactionPage> {
  const where = buildWhere(userId, filters);
  const orderBy = {
    [filters.sortBy]: filters.sortOrder,
  } as Prisma.TransactionOrderByWithRelationInput;

  const [rows, total] = await prisma.$transaction([
    prisma.transaction.findMany({
      where,
      orderBy,
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
    }),
    prisma.transaction.count({ where }),
  ]);

  return { items: rows.map(serialize), total, page: filters.page, limit: filters.limit };
}

export async function getTransactionById(userId: string, id: string): Promise<PublicTransaction> {
  const found = await prisma.transaction.findFirst({ where: { id, userId } });
  if (!found) {
    throw new AppError(404, 'Transaction not found');
  }
  return serialize(found);
}

export async function updateTransaction(
  userId: string,
  id: string,
  data: UpdateTransactionInput,
): Promise<PublicTransaction> {
  // Ensure the transaction exists and belongs to the user before updating.
  const existing = await prisma.transaction.findFirst({ where: { id, userId } });
  if (!existing) {
    throw new AppError(404, 'Transaction not found');
  }

  const updated = await prisma.transaction.update({
    where: { id },
    data: {
      type: data.type,
      amount: data.amount !== undefined ? new Prisma.Decimal(data.amount) : undefined,
      category: data.category,
      note: data.note,
      date: data.date,
    },
  });
  return serialize(updated);
}

export async function deleteTransaction(userId: string, id: string): Promise<void> {
  const result = await prisma.transaction.deleteMany({ where: { id, userId } });
  if (result.count === 0) {
    throw new AppError(404, 'Transaction not found');
  }
}

export interface Summary {
  income: number;
  expense: number;
  balance: number;
  count: number;
}

export async function getSummary(userId: string, filters: SummaryInput): Promise<Summary> {
  const where = buildWhere(userId, filters);
  const grouped = await prisma.transaction.groupBy({
    by: ['type'],
    where,
    _sum: { amount: true },
    _count: { _all: true },
  });

  let income = 0;
  let expense = 0;
  let count = 0;
  for (const group of grouped) {
    const sum = Number(group._sum.amount ?? 0);
    count += group._count._all;
    if (group.type === 'INCOME') income = sum;
    else expense = sum;
  }

  return { income, expense, balance: income - expense, count };
}
