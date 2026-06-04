import type { NextFunction, Request, Response } from 'express';
import { ZodError, type ZodSchema } from 'zod';

import { AppError } from './errorHandler';

/**
 * Returns middleware that validates `req.body` against a Zod schema, replacing
 * it with the parsed (and coerced) value. Invalid input yields a 400 AppError.
 */
export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      next(new AppError(400, formatZodError(result.error)));
      return;
    }
    req.body = result.data;
    next();
  };
}

/**
 * Validates `req.query` against a Zod schema (with coercion) and stores the
 * parsed result on `res.locals.query`, since `req.query` is read-only typed.
 */
export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      next(new AppError(400, formatZodError(result.error)));
      return;
    }
    res.locals.query = result.data;
    next();
  };
}

function formatZodError(error: ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.join('.');
      return path ? `${path}: ${issue.message}` : issue.message;
    })
    .join('; ');
}
