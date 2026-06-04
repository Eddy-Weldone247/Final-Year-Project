export type Role = 'USER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: Role;
  isEmailVerified: boolean;
  createdAt: string;
}

export interface UpdateProfilePayload {
  name?: string;
  email?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

/** A locally picked image asset to upload as an avatar. */
export interface ImageAsset {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  password: string;
}

/** Returned by login: the authenticated user plus a JWT access token. */
export interface AuthResult {
  user: User;
  token: string;
}

/** Generic message response (register, forgot/reset password). */
export interface MessageResult {
  message: string;
}
