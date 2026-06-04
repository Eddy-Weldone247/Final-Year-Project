import type { Request, Response } from 'express';

import * as budgetService from '../services/budget.service';
import { asyncHandler } from '../utils/asyncHandler';
import type { ListBudgetsInput } from '../validators/budget.schema';

export const create = asyncHandler(async (req: Request, res: Response) => {
  const budget = await budgetService.createBudget(req.user!.id, req.body);
  res.status(201).json({ budget });
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { month } = res.locals.query as ListBudgetsInput;
  const overview = await budgetService.getBudgets(req.user!.id, month);
  res.status(200).json(overview);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const budget = await budgetService.updateBudget(req.user!.id, req.params.id!, req.body.amount);
  res.status(200).json({ budget });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await budgetService.deleteBudget(req.user!.id, req.params.id!);
  res.status(200).json({ message: 'Budget deleted' });
});
