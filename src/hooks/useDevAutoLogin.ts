import { useEffect, useRef, useState } from 'react';

import * as authApi from '@/api/auth.api';
import { config } from '@/constants/config';
import { useAuthStore } from '@/store/authStore';

/**
 * DEV ONLY: signs into the demo account automatically so the authenticated
 * screens can be tested without filling in the login form. Never runs in
 * production (guarded by `__DEV__`). Returns true while the attempt is in
 * flight, so the caller can show a loading state instead of the auth form.
 */
export function useDevAutoLogin(): boolean {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const setAuth = useAuthStore((state) => state.setAuth);

  const enabled = __DEV__ && config.devAutoLogin;
  const started = useRef(false);
  const [attempting, setAttempting] = useState(false);

  useEffect(() => {
    if (!enabled || !hasHydrated || isAuthenticated || started.current) {
      return;
    }
    started.current = true;
    setAttempting(true);
    authApi
      .login({ email: config.devEmail, password: config.devPassword })
      .then(({ user, token }) => setAuth(user, token))
      .catch((error) => {
        console.warn('[dev auto-login] failed — showing the login form instead.', error?.message);
      })
      .finally(() => setAttempting(false));
  }, [enabled, hasHydrated, isAuthenticated, setAuth]);

  return attempting;
}
