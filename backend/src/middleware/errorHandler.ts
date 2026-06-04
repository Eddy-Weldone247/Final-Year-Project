import type { NextFunction, Request, Response } from 'express';

import { env } from '../config/env';

/**
 * Application-level error that carries an HTTP status code.
 * Throw this from controllers/services for predictable error responses.
 */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/** Centralized Express error handler. Must be registered last. */
export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  // Multer (file upload) errors carry safe messages, e.g. "File too large".
  const isMulterError = err.name === 'MulterError';
  const statusCode = err instanceof AppError ? err.statusCode : isMulterError ? 400 : 500;
  const message = err instanceof AppError || isMulterError ? err.message : 'Internal Server Error';

  // Always log unexpected errors; never leak stack traces to clients.
  if (statusCode >= 500) {
    console.error(err);
  }

  res.status(statusCode).json({
    status: 'error',
    message,
    ...(env.isProduction ? {} : { stack: err.stack }),
  });
}
