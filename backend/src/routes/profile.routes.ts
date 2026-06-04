import { Router } from 'express';

import * as profileController from '../controllers/profile.controller';
import { authenticate } from '../middleware/auth.middleware';
import { uploadAvatar } from '../middleware/upload';
import { validate } from '../middleware/validate.middleware';
import { changePasswordSchema, updateProfileSchema } from '../validators/profile.schema';

export const profileRouter = Router();

// All profile routes require authentication.
profileRouter.use(authenticate);

profileRouter.get('/', profileController.getProfile);
profileRouter.patch('/', validate(updateProfileSchema), profileController.updateProfile);
profileRouter.patch('/password', validate(changePasswordSchema), profileController.changePassword);
profileRouter.post('/avatar', uploadAvatar, profileController.uploadAvatar);
