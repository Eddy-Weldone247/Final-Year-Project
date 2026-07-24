import { apiClient } from './client';

/**
 * Generates (and stores) a spending forecast from the existing Linear Regression
 * ML service for the next `days` days. Consumed only — the model is not
 * retrained or changed here.
 */
export async function forecastSpending(days: number): Promise<unknown> {
  const { data } = await apiClient.post('/predictions/forecast', null, { params: { days } });
  return data;
}
