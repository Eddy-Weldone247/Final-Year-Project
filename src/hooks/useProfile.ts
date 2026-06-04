import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import * as profileApi from '@/api/profile.api';
import { useAuthStore } from '@/store/authStore';

const PROFILE_KEY = ['profile'] as const;

/** Fetches the current user's profile. Sync to the store via the returned data. */
export function useProfile() {
  return useQuery({ queryKey: PROFILE_KEY, queryFn: profileApi.getProfile });
}

export function useUpdateProfile() {
  const setUser = useAuthStore((state) => state.setUser);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: profileApi.updateProfile,
    onSuccess: (user) => {
      setUser(user);
      queryClient.setQueryData(PROFILE_KEY, user);
    },
  });
}

export function useChangePassword() {
  return useMutation({ mutationFn: profileApi.changePassword });
}

export function useUploadAvatar() {
  const setUser = useAuthStore((state) => state.setUser);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: profileApi.uploadAvatar,
    onSuccess: (user) => {
      setUser(user);
      queryClient.setQueryData(PROFILE_KEY, user);
    },
  });
}
