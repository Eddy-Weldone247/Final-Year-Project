import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import * as transactionApi from '@/api/transaction.api';
import { onTransactionCreated } from '@/services/notifications';
import type {
  CreateTransactionPayload,
  TransactionFilters,
  UpdateTransactionPayload,
} from '@/types/transaction';

const KEY = 'transactions';
const PAGE_SIZE = 20;

/** Paginated, filterable transaction list (infinite scroll). */
export function useTransactions(filters: TransactionFilters = {}) {
  return useInfiniteQuery({
    queryKey: [KEY, 'list', filters],
    queryFn: ({ pageParam }) =>
      transactionApi.listTransactions({ ...filters, page: pageParam, limit: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (last) => {
      const loaded = (last.page - 1) * last.limit + last.items.length;
      return loaded < last.total ? last.page + 1 : undefined;
    },
  });
}

export function useTransactionSummary(filters: TransactionFilters = {}) {
  return useQuery({
    queryKey: [KEY, 'summary', filters],
    queryFn: () => transactionApi.getSummary(filters),
  });
}

function useInvalidateTransactions() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: [KEY] });
    queryClient.invalidateQueries({ queryKey: ['stats'] });
  };
}

export function useCreateTransaction() {
  const invalidate = useInvalidateTransactions();
  return useMutation({
    mutationFn: (payload: CreateTransactionPayload) => transactionApi.createTransaction(payload),
    onSuccess: (transaction) => {
      invalidate();
      onTransactionCreated(transaction);
    },
  });
}

export function useUpdateTransaction() {
  const invalidate = useInvalidateTransactions();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTransactionPayload }) =>
      transactionApi.updateTransaction(id, payload),
    onSuccess: invalidate,
  });
}

export function useDeleteTransaction() {
  const invalidate = useInvalidateTransactions();
  return useMutation({
    mutationFn: (id: string) => transactionApi.deleteTransaction(id),
    onSuccess: invalidate,
  });
}
