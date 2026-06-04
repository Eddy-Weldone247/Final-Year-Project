import { Router } from 'express';

import * as adminController from '../controllers/admin.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import { validateQuery } from '../middleware/validate.middleware';
import { listUsersSchema } from '../validators/admin.schema';

export const adminRouter = Router();

// Every admin route requires a valid token AND the ADMIN role.
adminRouter.use(authenticate);
adminRouter.use(requireAdmin);

adminRouter.get('/stats', adminController.stats);
adminRouter.get('/users', validateQuery(listUsersSchema), adminController.users);
