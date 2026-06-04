import { PermissionsAndroid, Platform } from 'react-native';

import type { SmsMessage } from './types';

/**
 * `react-native-get-sms-android` is a native module that only exists in a
 * development/standalone build. It is loaded defensively so the app still
 * bundles and runs in Expo Go (where SMS reading is simply unavailable).
 */
interface SmsAndroidModule {
  list: (
    filter: string,
    fail: (error: string) => void,
    success: (count: number, smsListJson: string) => void,
  ) => void;
}

let SmsAndroid: SmsAndroidModule | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require('react-native-get-sms-android');
  SmsAndroid = (mod?.default ?? mod) as SmsAndroidModule | null;
} catch {
  SmsAndroid = null;
}

/** True only on Android with the native SMS module present (dev build). */
export function isSmsReadingAvailable(): boolean {
  return Platform.OS === 'android' && !!SmsAndroid && typeof SmsAndroid.list === 'function';
}

/** Requests the Android READ_SMS runtime permission. */
export async function requestSmsPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_SMS, {
    title: 'Read SMS',
    message:
      'ExpenSee reads your bank and mobile-money SMS alerts to automatically create transactions. Messages are processed on your device.',
    buttonPositive: 'Allow',
    buttonNegative: 'Deny',
  });
  return result === PermissionsAndroid.RESULTS.GRANTED;
}

interface ReadInboxOptions {
  maxCount?: number;
  /** Only return messages received on/after this epoch-ms timestamp. */
  sinceMs?: number;
}

/** Reads inbox SMS messages (most recent first). */
export function readInbox({ maxCount = 300, sinceMs }: ReadInboxOptions = {}): Promise<
  SmsMessage[]
> {
  return new Promise((resolve, reject) => {
    if (!SmsAndroid?.list) {
      reject(new Error('SMS reading needs a development build — it is not available in Expo Go.'));
      return;
    }
    const filter = JSON.stringify({
      box: 'inbox',
      maxCount,
      ...(sinceMs ? { minDate: sinceMs } : {}),
    });
    SmsAndroid.list(
      filter,
      (error) => reject(new Error(error || 'Failed to read SMS messages')),
      (_count, smsListJson) => {
        try {
          const raw = JSON.parse(smsListJson) as Array<{
            _id: number | string;
            address?: string;
            body?: string;
            date?: number | string;
          }>;
          resolve(
            raw.map((m) => ({
              id: String(m._id),
              address: m.address ?? '',
              body: m.body ?? '',
              date: Number(m.date) || Date.now(),
            })),
          );
        } catch (parseError) {
          reject(parseError instanceof Error ? parseError : new Error('Failed to parse SMS list'));
        }
      },
    );
  });
}
