import { Router } from 'express';

import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from '../validators/auth.schema';

export const authRouter = Router();

authRouter.post('/register', validate(registerSchema), authController.register);
authRouter.post('/login', validate(loginSchema), authController.login);

// POST is used by API clients; GET handles the link embedded in emails.
authRouter.post('/verify-email', validate(verifyEmailSchema), authController.verifyEmail);
authRouter.get('/verify-email', authController.verifyEmailByLink);

authRouter.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);
authRouter.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

authRouter.get('/me', authenticate, authController.me);
