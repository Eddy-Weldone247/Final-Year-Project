import { useMutation } from '@tanstack/react-query';

import * as authApi from '@/api/auth.api';
import { notifyWelcome } from '@/services/appNotifications';
import { useAuthStore } from '@/store/authStore';

/** Logs in and stores the session; navigation reacts to the auth state. */
export function useLogin() {
  const setAuth = useAuthStore((state) => state.setAuth);
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: ({ user, token }) => setAuth(user, token),
  });
}

/** Registers and stores the session; navigation reacts to the auth state. */
export function useRegister() {
  const setAuth = useAuthStore((state) => state.setAuth);
  return useMutation({
    mutationFn: authApi.register,
    onSuccess: ({ user, token }) => {
      setAuth(user, token);
      notifyWelcome();
    },
  });
}

export function useForgotPassword() {
  return useMutation({ mutationFn: authApi.forgotPassword });
}

export function useResetPassword() {
  return useMutation({ mutationFn: authApi.resetPassword });
}

/** Clears the persisted session. */
export function useLogout() {
  return useAuthStore((state) => state.clearAuth);
}
