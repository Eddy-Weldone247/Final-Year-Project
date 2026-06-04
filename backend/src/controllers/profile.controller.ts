import type { Request, Response } from 'express';

import { env } from '../config/env';
import { AppError } from '../middleware/errorHandler';
import * as profileService from '../services/profile.service';
import { asyncHandler } from '../utils/asyncHandler';

/** Origin of this server (API base URL without the trailing /api). */
const serverOrigin = env.apiUrl.replace(/\/api\/?$/, '');

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await profileService.getProfile(req.user!.id);
  res.status(200).json({ user });
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await profileService.updateProfile(req.user!.id, req.body);
  res.status(200).json({ user });
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  await profileService.changePassword(req.user!.id, req.body.currentPassword, req.body.newPassword);
  res.status(200).json({ message: 'Password changed successfully.' });
});

export const uploadAvatar = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new AppError(400, 'No image file provided');
  }
  const avatarUrl = `${serverOrigin}/uploads/${req.file.filename}`;
  const user = await profileService.updateAvatar(req.user!.id, avatarUrl);
  res.status(200).json({ user });
});
