import { useQuery } from '@tanstack/react-query';

import * as adminApi from '@/api/admin.api';

export function useAdminStats() {
  return useQuery({ queryKey: ['admin', 'stats'], queryFn: adminApi.getAdminStats });
}

export function useAdminUsers(page = 1, limit = 20) {
  return useQuery({
    queryKey: ['admin', 'users', page, limit],
    queryFn: () => adminApi.getAdminUsers(page, limit),
  });
}
