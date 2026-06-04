import type { Request, Response } from 'express';

import * as adminService from '../services/admin.service';
import { asyncHandler } from '../utils/asyncHandler';
import type { ListUsersInput } from '../validators/admin.schema';

// Platform-wide metrics: total users/transactions/income/expenses + category stats.
export const stats = asyncHandler(async (_req: Request, res: Response) => {
  const data = await adminService.getStats();
  res.status(200).json(data);
});

// Paginated list of all users.
export const users = asyncHandler(async (_req: Request, res: Response) => {
  const { page, limit } = res.locals.query as ListUsersInput;
  const result = await adminService.listUsers(page, limit);
  res.status(200).json(result);
});
