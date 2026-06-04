import { prisma } from '../config/prisma';
import { AppError } from '../middleware/errorHandler';
import type { PublicUser } from '../types/user';
import { createSecureToken } from '../utils/crypto';
import { hashPassword, verifyPassword } from '../utils/password';
import { publicUserSelect } from './auth.service';
import { sendVerificationEmail } from './email.service';

const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface UpdateProfileParams {
  name?: string;
  email?: string;
}

/** Returns the current user's public profile. */
export async function getProfile(userId: string): Promise<PublicUser> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: publicUserSelect });
  if (!user) {
    throw new AppError(404, 'User not found');
  }
  return user;
}

/**
 * Updates name and/or email. Changing the email resets verification and sends a
 * fresh verification link to the new address.
 */
export async function updateProfile(
  userId: string,
  { name, email }: UpdateProfileParams,
): Promise<PublicUser> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError(404, 'User not found');
  }

  const data: {
    name?: string;
    email?: string;
    isEmailVerified?: boolean;
    emailVerificationToken?: string;
    emailVerificationExpires?: Date;
  } = {};

  if (name !== undefined) {
    data.name = name;
  }

  let verificationToken: string | null = null;
  const normalizedEmail = email?.toLowerCase();
  if (normalizedEmail && normalizedEmail !== user.email) {
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      throw new AppError(409, 'An account with this email already exists');
    }
    const { token, hashedToken } = createSecureToken();
    verificationToken = token;
    data.email = normalizedEmail;
    data.isEmailVerified = false;
    data.emailVerificationToken = hashedToken;
    data.emailVerificationExpires = new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS);
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data,
    select: publicUserSelect,
  });

  if (verificationToken && normalizedEmail) {
    await sendVerificationEmail(normalizedEmail, verificationToken);
  }

  return updated;
}

/** Verifies the current password and sets a new one. */
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError(404, 'User not found');
  }

  const valid = await verifyPassword(currentPassword, user.password);
  if (!valid) {
    throw new AppError(401, 'Current password is incorrect');
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: userId }, data: { password: passwordHash } });
}

/** Sets the user's avatar URL after a successful upload. */
export async function updateAvatar(userId: string, avatarUrl: string): Promise<PublicUser> {
  return prisma.user.update({
    where: { id: userId },
    data: { avatarUrl },
    select: publicUserSelect,
  });
}
