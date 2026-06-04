import { Prisma, type PredictionKind } from '@prisma/client';

import { env } from '../config/env';
import { prisma } from '../config/prisma';
import { AppError } from '../middleware/errorHandler';

// ---- Shapes returned by the Python ML service -----------------------------

interface MlMetrics {
  mae: number | null;
  rmse: number | null;
  r2: number | null;
}
interface MlTransaction {
  date: string;
  amount: number;
  type: string;
  category: string | null;
}
export interface SpendingForecast {
  horizon_days: number;
  predicted_total: number;
  daily_average: number;
  daily: { date: string; predicted: number }[];
  metrics: MlMetrics;
  n_samples: number;
  method: string;
}
export interface CategoryForecast {
  horizon_days: number;
  categories: {
    category: string;
    predicted_total: number;
    daily_average: number;
    metrics: MlMetrics;
    n_samples: number;
    method: string;
  }[];
}
export interface TrainResult {
  n_samples: number;
  metrics: MlMetrics;
  slope_per_day: number;
  intercept: number;
  method: string;
}

// ---- Transport: send transaction history, receive predictions -------------

/** Gathers the user's transactions in the shape the ML service expects. */
async function transactionHistory(userId: string): Promise<MlTransaction[]> {
  const rows = await prisma.transaction.findMany({
    where: { userId },
    select: { date: true, amount: true, type: true, category: true },
    orderBy: { date: 'asc' },
  });
  return rows.map((t) => ({
    date: t.date.toISOString().slice(0, 10),
    amount: Number(t.amount),
    type: t.type,
    category: t.category,
  }));
}

/** POSTs to the FastAPI ML service, mapping outages to clean API errors. */
async function callMl<T>(path: string, body: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${env.mlServiceUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new AppError(503, 'Prediction service is unavailable. Is the ML service running?');
  }
  if (!response.ok) {
    throw new AppError(502, `Prediction service error (${response.status})`);
  }
  return (await response.json()) as T;
}

// ---- Persistence ----------------------------------------------------------

async function store(
  userId: string,
  kind: PredictionKind,
  horizonDays: number | null,
  payload: object,
  metrics?: MlMetrics,
  method?: string,
): Promise<void> {
  await prisma.prediction.create({
    data: {
      userId,
      kind,
      horizonDays,
      result: payload as unknown as Prisma.InputJsonValue,
      mae: metrics?.mae ?? null,
      rmse: metrics?.rmse ?? null,
      r2: metrics?.r2 ?? null,
      method: method ?? null,
    },
  });
}

// ---- Public API: generate (+ store) and read stored predictions -----------

export async function predictSpending(
  userId: string,
  horizonDays: number,
): Promise<SpendingForecast> {
  const transactions = await transactionHistory(userId);
  const forecast = await callMl<SpendingForecast>('/predict/spending', {
    transactions,
    horizon_days: horizonDays,
  });
  await store(userId, 'SPENDING', horizonDays, forecast, forecast.metrics, forecast.method);
  return forecast;
}

export async function predictCategory(
  userId: string,
  horizonDays: number,
): Promise<CategoryForecast> {
  const transactions = await transactionHistory(userId);
  const forecast = await callMl<CategoryForecast>('/predict/category', {
    transactions,
    horizon_days: horizonDays,
  });
  await store(userId, 'CATEGORY', horizonDays, forecast);
  return forecast;
}

export async function trainModel(userId: string): Promise<TrainResult> {
  const transactions = await transactionHistory(userId);
  const result = await callMl<TrainResult>('/train', { transactions, horizon_days: 7 });
  await store(userId, 'MODEL', null, result, result.metrics, result.method);
  return result;
}

export function listPredictions(userId: string, kind?: PredictionKind) {
  return prisma.prediction.findMany({
    where: { userId, ...(kind ? { kind } : {}) },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}

export function latestPrediction(userId: string, kind: PredictionKind, horizonDays?: number) {
  return prisma.prediction.findFirst({
    where: { userId, kind, ...(horizonDays ? { horizonDays } : {}) },
    orderBy: { createdAt: 'desc' },
  });
}
