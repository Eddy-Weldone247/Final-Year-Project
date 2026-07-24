import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

import * as predictionApi from '@/api/prediction.api';
import { notifyPredictionReady } from '@/services/appNotifications';
import { useAuthStore } from '@/store/authStore';

/**
 * Runs the existing Linear Regression spending forecast (backend endpoint —
 * model unchanged) in the background and raises a "Spending Prediction Ready"
 * notification when it completes. Cached generously and non-blocking; if the ML
 * service is unavailable the query simply errors and nothing is shown.
 */
export function usePrediction(): void {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const query = useQuery({
    queryKey: ['prediction', 'spending'],
    queryFn: () => predictionApi.forecastSpending(30),
    enabled: isAuthenticated,
    staleTime: 6 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (query.isSuccess) notifyPredictionReady(); // deduped once per month
  }, [query.isSuccess]);
}
