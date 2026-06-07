import type {
  AuthResult,
  ForgotPasswordPayload,
  LoginPayload,
  MessageResult,
  RegisterPayload,
  ResetPasswordPayload,
} from '@/types/auth';

import { apiClient } from './client';

export async function login(payload: LoginPayload): Promise<AuthResult> {
  const { data } = await apiClient.post<AuthResult>('/auth/login', payload);
  return data;
}

export async function register(payload: RegisterPayload): Promise<MessageResult> {
  const { data } = await apiClient.post<MessageResult>('/auth/register', payload);
  return data;
}

export async function forgotPassword(payload: ForgotPasswordPayload): Promise<MessageResult> {
  const { data } = await apiClient.post<MessageResult>('/auth/forgot-password', payload);
  return data;
}

export async function resetPassword(payload: ResetPasswordPayload): Promise<MessageResult> {
  const { data } = await apiClient.post<MessageResult>('/auth/reset-password', payload);
  return data;
}

export async function verifyEmail(payload: { token: string }): Promise<MessageResult> {
  const { data } = await apiClient.post<MessageResult>('/auth/verify-email', payload);
  return data;
}
