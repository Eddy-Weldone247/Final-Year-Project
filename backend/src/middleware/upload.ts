import fs from 'node:fs';
import path from 'node:path';

import multer from 'multer';

import { AppError } from './errorHandler';

/** Directory where uploaded avatars are stored (also served statically). */
export const uploadsDir = path.resolve(process.cwd(), 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `${req.user?.id ?? 'anon'}-${Date.now()}${ext}`);
  },
});

/** Accepts a single `avatar` image field (max 5MB, images only). */
export const uploadAvatar = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpe?g|png|webp|gif)$/.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError(400, 'Only image uploads are allowed'));
    }
  },
}).single('avatar');
