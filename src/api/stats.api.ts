import type { DashboardStats } from '@/types/stats';

import { apiClient } from './client';

export async function getStats(): Promise<DashboardStats> {
  const { data } = await apiClient.get<DashboardStats>('/transactions/stats');
  return data;
}
