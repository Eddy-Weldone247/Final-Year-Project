import { z } from 'zod';

import { categoryEnum } from './transaction.schema';

const month = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'month must be in YYYY-MM format');
const amount = z.number().positive('Amount must be greater than 0').max(1_000_000_000);

export const createBudgetSchema = z.object({
  month,
  // Omit or null for the overall monthly budget; a category for a per-category budget.
  category: categoryEnum.nullable().optional(),
  amount,
});

export const updateBudgetSchema = z.object({ amount });

export const listBudgetsSchema = z.object({ month: month.optional() });

export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
export type ListBudgetsInput = z.infer<typeof listBudgetsSchema>;
