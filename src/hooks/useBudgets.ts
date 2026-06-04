import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import * as budgetApi from '@/api/budget.api';
import type { CreateBudgetPayload, UpdateBudgetPayload } from '@/types/budget';

const KEY = 'budgets';

export function useBudgets(month: string) {
  return useQuery({
    queryKey: [KEY, month],
    queryFn: () => budgetApi.listBudgets(month),
  });
}

function useInvalidateBudgets() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: [KEY] });
}

export function useCreateBudget() {
  const invalidate = useInvalidateBudgets();
  return useMutation({
    mutationFn: (payload: CreateBudgetPayload) => budgetApi.createBudget(payload),
    onSuccess: invalidate,
  });
}

export function useUpdateBudget() {
  const invalidate = useInvalidateBudgets();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateBudgetPayload }) =>
      budgetApi.updateBudget(id, payload),
    onSuccess: invalidate,
  });
}

export function useDeleteBudget() {
  const invalidate = useInvalidateBudgets();
  return useMutation({
    mutationFn: (id: string) => budgetApi.deleteBudget(id),
    onSuccess: invalidate,
  });
}
