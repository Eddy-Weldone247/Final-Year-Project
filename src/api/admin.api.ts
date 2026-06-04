import type { AdminStats, AdminUserPage } from '@/types/admin';

import { apiClient } from './client';

export async function getAdminStats(): Promise<AdminStats> {
  const { data } = await apiClient.get<AdminStats>('/admin/stats');
  return data;
}

export async function getAdminUsers(page = 1, limit = 20): Promise<AdminUserPage> {
  const { data } = await apiClient.get<AdminUserPage>('/admin/users', { params: { page, limit } });
  return data;
}
