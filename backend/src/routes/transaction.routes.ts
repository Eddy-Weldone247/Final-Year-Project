import { Router } from 'express';

import * as transactionController from '../controllers/transaction.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate, validateQuery } from '../middleware/validate.middleware';
import {
  createTransactionSchema,
  listTransactionsSchema,
  summarySchema,
  updateTransactionSchema,
} from '../validators/transaction.schema';

export const transactionRouter = Router();

// All transaction routes require authentication.
transactionRouter.use(authenticate);

transactionRouter.post('/', validate(createTransactionSchema), transactionController.create);
transactionRouter.get('/', validateQuery(listTransactionsSchema), transactionController.list);

// Static routes must precede the parameterized ":id" route.
transactionRouter.get('/summary', validateQuery(summarySchema), transactionController.summary);
transactionRouter.get('/stats', transactionController.stats);

transactionRouter.get('/:id', transactionController.getOne);
transactionRouter.patch('/:id', validate(updateTransactionSchema), transactionController.update);
transactionRouter.delete('/:id', transactionController.remove);
