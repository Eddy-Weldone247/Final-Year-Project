import type { Request, Response } from 'express';

import * as authService from '../services/auth.service';
import { asyncHandler } from '../utils/asyncHandler';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { user, token } = await authService.registerUser(req.body);
  res.status(201).json({ message: 'Registration successful.', user, token });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.loginUser(req.body);
  res.status(200).json(result);
});

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  await authService.verifyEmail(req.body.token);
  res.status(200).json({ message: 'Email verified successfully. You can now sign in.' });
});

/** Browser-friendly verification handler for the link contained in emails. */
export const verifyEmailByLink = asyncHandler(async (req: Request, res: Response) => {
  const token = String(req.query.token ?? '');
  try {
    await authService.verifyEmail(token);
    res
      .status(200)
      .send(
        renderPage('Email verified ✅', 'Your email is verified. You can now sign in to ExpenSee.'),
      );
  } catch {
    res
      .status(400)
      .send(renderPage('Verification failed', 'This verification link is invalid or has expired.'));
  }
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  await authService.requestPasswordReset(req.body.email);
  res
    .status(200)
    .json({ message: 'If an account exists for that email, a reset code has been sent.' });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  await authService.resetPassword(req.body.token, req.body.password);
  res.status(200).json({ message: 'Your password has been reset. You can now sign in.' });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  res.status(200).json({ user: req.user });
});

function renderPage(title: string, message: string): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title} — ExpenSee</title>
    <style>
      body { font-family: system-ui, sans-serif; background: #f3f4f6; display: grid; place-items: center; height: 100vh; margin: 0; }
      .card { background: #fff; padding: 2rem 2.5rem; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,.08); text-align: center; max-width: 420px; }
      h1 { font-size: 1.25rem; margin: 0 0 .5rem; }
      p { color: #4b5563; margin: 0; }
    </style>
  </head>
  <body>
    <div class="card"><h1>${title}</h1><p>${message}</p></div>
  </body>
</html>`;
}
