import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra ?? {};

/** Runtime configuration resolved from env vars, with app.json as fallback. */
export const config = {
  apiUrl:
    process.env.EXPO_PUBLIC_API_URL ??
    (extra.apiUrl as string | undefined) ??
    'http://localhost:4000/api',

  // DEV ONLY — demo credentials used by the "Skip login (dev)" button and the
  // optional auto-login. Gated by __DEV__ where used, so never active in prod.
  // Auto-login is OFF by default (the login screen shows the Skip button);
  // set EXPO_PUBLIC_DEV_AUTOLOGIN=true to also skip the screen entirely.
  devAutoLogin: process.env.EXPO_PUBLIC_DEV_AUTOLOGIN === 'true',
  devEmail: process.env.EXPO_PUBLIC_DEV_EMAIL ?? 'demo@expensee.app',
  devPassword: process.env.EXPO_PUBLIC_DEV_PASSWORD ?? 'demo12345',
} as const;
