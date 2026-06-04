import { z } from 'zod';

export const transactionTypeEnum = z.enum(['INCOME', 'EXPENSE']);

export const categoryEnum = z.enum([
  'FOOD',
  'TRANSPORT',
  'SHOPPING',
  'ENTERTAINMENT',
  'UTILITIES',
  'HEALTHCARE',
  'EDUCATION',
  'OTHERS',
]);

const amount = z.number().positive('Amount must be greater than 0').max(1_000_000_000);

export const createTransactionSchema = z.object({
  type: transactionTypeEnum,
  amount,
  category: categoryEnum,
  note: z.string().trim().max(280).optional(),
  date: z.coerce.date().optional(),
});

export const updateTransactionSchema = z
  .object({
    type: transactionTypeEnum.optional(),
    amount: amount.optional(),
    category: categoryEnum.optional(),
    note: z.string().trim().max(280).nullable().optional(),
    date: z.coerce.date().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Provide at least one field to update',
  });

export const listTransactionsSchema = z.object({
  type: transactionTypeEnum.optional(),
  category: categoryEnum.optional(),
  search: z.string().trim().min(1).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  minAmount: z.coerce.number().nonnegative().optional(),
  maxAmount: z.coerce.number().nonnegative().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['date', 'amount', 'createdAt']).default('date'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const summarySchema = z.object({
  type: transactionTypeEnum.optional(),
  category: categoryEnum.optional(),
  search: z.string().trim().min(1).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type ListTransactionsInput = z.infer<typeof listTransactionsSchema>;
export type SummaryInput = z.infer<typeof summarySchema>;
