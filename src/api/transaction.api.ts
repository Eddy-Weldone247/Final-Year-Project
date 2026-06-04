import type {
  CreateTransactionPayload,
  Transaction,
  TransactionFilters,
  TransactionPage,
  TransactionSummary,
  UpdateTransactionPayload,
} from '@/types/transaction';

import { apiClient } from './client';

function toParams(filters: TransactionFilters): Record<string, string | number> {
  const params: Record<string, string | number> = {};
  if (filters.type) params.type = filters.type;
  if (filters.category) params.category = filters.category;
  if (filters.search) params.search = filters.search;
  if (filters.startDate) params.startDate = filters.startDate;
  if (filters.endDate) params.endDate = filters.endDate;
  if (filters.page) params.page = filters.page;
  if (filters.limit) params.limit = filters.limit;
  return params;
}

export async function listTransactions(filters: TransactionFilters): Promise<TransactionPage> {
  const { data } = await apiClient.get<TransactionPage>('/transactions', {
    params: toParams(filters),
  });
  return data;
}

export async function getSummary(filters: TransactionFilters = {}): Promise<TransactionSummary> {
  const { data } = await apiClient.get<TransactionSummary>('/transactions/summary', {
    params: toParams(filters),
  });
  return data;
}

export async function createTransaction(payload: CreateTransactionPayload): Promise<Transaction> {
  const { data } = await apiClient.post<{ transaction: Transaction }>('/transactions', payload);
  return data.transaction;
}

export async function updateTransaction(
  id: string,
  payload: UpdateTransactionPayload,
): Promise<Transaction> {
  const { data } = await apiClient.patch<{ transaction: Transaction }>(
    `/transactions/${id}`,
    payload,
  );
  return data.transaction;
}

export async function deleteTransaction(id: string): Promise<void> {
  await apiClient.delete(`/transactions/${id}`);
}
