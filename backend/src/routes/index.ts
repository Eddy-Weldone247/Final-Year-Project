import { Router } from 'express';

import { adminRouter } from './admin.routes';
import { authRouter } from './auth.routes';
import { budgetRouter } from './budget.routes';
import { predictionRouter } from './prediction.routes';
import { profileRouter } from './profile.routes';
import { transactionRouter } from './transaction.routes';

export const router = Router();

/** Liveness/health probe. */
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.use('/auth', authRouter);
router.use('/profile', profileRouter);
router.use('/transactions', transactionRouter);
router.use('/budgets', budgetRouter);
router.use('/predictions', predictionRouter);
router.use('/admin', adminRouter);
