import type { Request, Response } from 'express';

import { getDashboardStats } from '../services/stats.service';
import * as transactionService from '../services/transaction.service';
import { asyncHandler } from '../utils/asyncHandler';
import type { ListTransactionsInput, SummaryInput } from '../validators/transaction.schema';

export const stats = asyncHandler(async (req: Request, res: Response) => {
  const data = await getDashboardStats(req.user!.id);
  res.status(200).json(data);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const transaction = await transactionService.createTransaction(req.user!.id, req.body);
  res.status(201).json({ transaction });
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const filters = res.locals.query as ListTransactionsInput;
  const result = await transactionService.getTransactions(req.user!.id, filters);
  res.status(200).json(result);
});

export const summary = asyncHandler(async (req: Request, res: Response) => {
  const filters = res.locals.query as SummaryInput;
  const data = await transactionService.getSummary(req.user!.id, filters);
  res.status(200).json(data);
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const transaction = await transactionService.getTransactionById(req.user!.id, req.params.id!);
  res.status(200).json({ transaction });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const transaction = await transactionService.updateTransaction(
    req.user!.id,
    req.params.id!,
    req.body,
  );
  res.status(200).json({ transaction });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await transactionService.deleteTransaction(req.user!.id, req.params.id!);
  res.status(200).json({ message: 'Transaction deleted' });
});
