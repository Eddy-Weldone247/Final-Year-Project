import type { NextFunction, Request, Response } from 'express';

import { getUserById } from '../services/auth.service';
import { verifyAccessToken } from '../services/token.service';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from './errorHandler';

const BEARER_PREFIX = 'Bearer ';

/** Requires a valid JWT and attaches the current user to `req.user`. */
export const authenticate = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (!header?.startsWith(BEARER_PREFIX)) {
      throw new AppError(401, 'Authentication required');
    }

    const token = header.slice(BEARER_PREFIX.length).trim();
    const payload = (() => {
      try {
        return verifyAccessToken(token);
      } catch {
        throw new AppError(401, 'Invalid or expired token');
      }
    })();

    const user = await getUserById(payload.sub);
    if (!user) {
      throw new AppError(401, 'User no longer exists');
    }

    req.user = user;
    next();
  },
);

/**
 * Restricts a route to admins. Must run *after* `authenticate` (which populates
 * `req.user`). Responds 403 for authenticated non-admins.
 */
export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    next(new AppError(401, 'Authentication required'));
    return;
  }
  if (req.user.role !== 'ADMIN') {
    next(new AppError(403, 'Admin access required'));
    return;
  }
  next();
}
