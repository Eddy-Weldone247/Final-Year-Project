import cors from 'cors';
import express, { type Application } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { uploadsDir } from './middleware/upload';
import { router } from './routes';

/** Builds and configures the Express application (no network binding). */
export function createApp(): Application {
  const app = express();

  // Security & parsing middleware. Allow uploaded images to be loaded by the
  // app from a different origin.
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors({ origin: env.corsOrigin }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Serve uploaded avatar images.
  app.use('/uploads', express.static(uploadsDir));

  // Request logging (skipped during tests).
  if (env.nodeEnv !== 'test') {
    app.use(morgan(env.isProduction ? 'combined' : 'dev'));
  }

  // API routes.
  app.use('/api', router);

  // Fallbacks (order matters: 404 then error handler).
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
