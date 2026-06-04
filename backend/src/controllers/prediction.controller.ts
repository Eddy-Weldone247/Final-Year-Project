import { type PredictionKind } from '@prisma/client';
import type { Request, Response } from 'express';

import { AppError } from '../middleware/errorHandler';
import * as predictionService from '../services/prediction.service';
import { asyncHandler } from '../utils/asyncHandler';

/** Parses a `days` query param, clamped to [1, 365], with a default. */
function days(raw: unknown, fallback: number): number {
  const n = Number(raw);
  return Number.isFinite(n) && n >= 1 && n <= 365 ? Math.floor(n) : fallback;
}

function parseKind(raw: unknown): PredictionKind | undefined {
  return raw === 'SPENDING' || raw === 'CATEGORY' || raw === 'MODEL' ? raw : undefined;
}

// Generate a fresh prediction (calls the ML service) and store it.
export const forecastSpending = asyncHandler(async (req: Request, res: Response) => {
  const data = await predictionService.predictSpending(req.user!.id, days(req.query.days, 7));
  res.status(201).json(data);
});

export const forecastCategory = asyncHandler(async (req: Request, res: Response) => {
  const data = await predictionService.predictCategory(req.user!.id, days(req.query.days, 30));
  res.status(201).json(data);
});

export const train = asyncHandler(async (req: Request, res: Response) => {
  const data = await predictionService.trainModel(req.user!.id);
  res.status(201).json(data);
});

// Read previously stored predictions (works even if the ML service is down).
export const history = asyncHandler(async (req: Request, res: Response) => {
  const items = await predictionService.listPredictions(req.user!.id, parseKind(req.query.kind));
  res.status(200).json({ items });
});

export const latest = asyncHandler(async (req: Request, res: Response) => {
  const kind = parseKind(req.query.kind) ?? 'SPENDING';
  const horizon = req.query.days !== undefined ? days(req.query.days, 7) : undefined;
  const prediction = await predictionService.latestPrediction(req.user!.id, kind, horizon);
  if (!prediction) {
    throw new AppError(404, 'No stored prediction found');
  }
  res.status(200).json({ prediction });
});
