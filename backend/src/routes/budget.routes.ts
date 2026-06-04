import { Router } from 'express';

import * as budgetController from '../controllers/budget.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate, validateQuery } from '../middleware/validate.middleware';
import {
  createBudgetSchema,
  listBudgetsSchema,
  updateBudgetSchema,
} from '../validators/budget.schema';

export const budgetRouter = Router();

budgetRouter.use(authenticate);

budgetRouter.get('/', validateQuery(listBudgetsSchema), budgetController.list);
budgetRouter.post('/', validate(createBudgetSchema), budgetController.create);
budgetRouter.patch('/:id', validate(updateBudgetSchema), budgetController.update);
budgetRouter.delete('/:id', budgetController.remove);
