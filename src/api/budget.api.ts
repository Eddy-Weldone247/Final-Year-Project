import type {
  BudgetProgress,
  BudgetsOverview,
  CreateBudgetPayload,
  UpdateBudgetPayload,
} from '@/types/budget';

import { apiClient } from './client';

export async function listBudgets(month: string): Promise<BudgetsOverview> {
  const { data } = await apiClient.get<BudgetsOverview>('/budgets', { params: { month } });
  return data;
}

export async function createBudget(payload: CreateBudgetPayload): Promise<BudgetProgress> {
  const { data } = await apiClient.post<{ budget: BudgetProgress }>('/budgets', payload);
  return data.budget;
}

export async function updateBudget(
  id: string,
  payload: UpdateBudgetPayload,
): Promise<BudgetProgress> {
  const { data } = await apiClient.patch<{ budget: BudgetProgress }>(`/budgets/${id}`, payload);
  return data.budget;
}

export async function deleteBudget(id: string): Promise<void> {
  await apiClient.delete(`/budgets/${id}`);
}
