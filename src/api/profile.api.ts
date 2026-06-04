import type {
  ChangePasswordPayload,
  ImageAsset,
  MessageResult,
  UpdateProfilePayload,
  User,
} from '@/types/auth';

import { apiClient } from './client';

export async function getProfile(): Promise<User> {
  const { data } = await apiClient.get<{ user: User }>('/profile');
  return data.user;
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<User> {
  const { data } = await apiClient.patch<{ user: User }>('/profile', payload);
  return data.user;
}

export async function changePassword(payload: ChangePasswordPayload): Promise<MessageResult> {
  const { data } = await apiClient.patch<MessageResult>('/profile/password', payload);
  return data;
}

export async function uploadAvatar(asset: ImageAsset): Promise<User> {
  const extension = asset.uri.split('.').pop() ?? 'jpg';
  const formData = new FormData();
  formData.append('avatar', {
    uri: asset.uri,
    name: asset.fileName ?? `avatar.${extension}`,
    type: asset.mimeType ?? `image/${extension}`,
  } as unknown as Blob);

  const { data } = await apiClient.post<{ user: User }>('/profile/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.user;
}
