import { prisma } from '../config/prisma';
import { AppError } from '../middleware/errorHandler';
import type { PublicUser } from '../types/user';
import { createSecureToken, hashToken } from '../utils/crypto';
import { hashPassword, verifyPassword } from '../utils/password';
import { sendPasswordResetEmail } from './email.service';
import { signAccessToken } from './token.service';

const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

/** Fields returned to clients — never includes the password or raw tokens. */
export const publicUserSelect = {
  id: true,
  email: true,
  name: true,
  avatarUrl: true,
  role: true,
  isEmailVerified: true,
  createdAt: true,
} as const;

interface RegisterParams {
  name: string;
  email: string;
  password: string;
}

interface LoginParams {
  email: string;
  password: string;
}

/**
 * Creates an account and signs the user straight in. Email verification is not
 * required — accounts are created ready to use and a JWT is returned so the app
 * can drop the user into the main screen immediately after registering.
 */
export async function registerUser({
  name,
  email,
  password,
}: RegisterParams): Promise<{ user: PublicUser; token: string }> {
  const normalizedEmail = email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    throw new AppError(409, 'An account with this email already exists');
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      name,
      email: normalizedEmail,
      password: passwordHash,
      isEmailVerified: true,
    },
    select: publicUserSelect,
  });

  const token = signAccessToken({ sub: user.id, email: user.email });
  return { user, token };
}

/** Authenticates a user and returns a signed access token. */
export async function loginUser({
  email,
  password,
}: LoginParams): Promise<{ user: PublicUser; token: string }> {
  const normalizedEmail = email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  // Use a single generic message to avoid leaking which accounts exist.
  if (!user || !(await verifyPassword(password, user.password))) {
    throw new AppError(401, 'Invalid email or password');
  }

  if (!user.isEmailVerified) {
    throw new AppError(403, 'Please verify your email before signing in');
  }

  const token = signAccessToken({ sub: user.id, email: user.email });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
    },
  };
}

/** Marks a user's email as verified given a valid, unexpired token. */
export async function verifyEmail(rawToken: string): Promise<void> {
  const hashedToken = hashToken(rawToken);
  const user = await prisma.user.findFirst({
    where: { emailVerificationToken: hashedToken, emailVerificationExpires: { gt: new Date() } },
  });

  if (!user) {
    throw new AppError(400, 'Verification link is invalid or has expired');
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      isEmailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpires: null,
    },
  });
}

/** Issues a password-reset token. Silent when the email is unknown. */
export async function requestPasswordReset(email: string): Promise<void> {
  const normalizedEmail = email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  // Respond identically whether or not the account exists.
  if (!user) {
    return;
  }

  const { token, hashedToken } = createSecureToken();
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: hashedToken,
      passwordResetExpires: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
    },
  });

  await sendPasswordResetEmail(normalizedEmail, token);
}

/** Sets a new password given a valid, unexpired reset token. */
export async function resetPassword(rawToken: string, newPassword: string): Promise<void> {
  const hashedToken = hashToken(rawToken);
  const user = await prisma.user.findFirst({
    where: { passwordResetToken: hashedToken, passwordResetExpires: { gt: new Date() } },
  });

  if (!user) {
    throw new AppError(400, 'Reset link is invalid or has expired');
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: passwordHash,
      passwordResetToken: null,
      passwordResetExpires: null,
    },
  });
}

/** Loads a public user by id (used by the auth middleware). */
export async function getUserById(id: string): Promise<PublicUser | null> {
  return prisma.user.findUnique({ where: { id }, select: publicUserSelect });
}
