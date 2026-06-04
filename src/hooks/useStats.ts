import { useQuery } from '@tanstack/react-query';

import * as statsApi from '@/api/stats.api';

export function useStats() {
  return useQuery({ queryKey: ['stats'], queryFn: statsApi.getStats });
}
