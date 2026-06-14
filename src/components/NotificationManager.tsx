import { useEffect } from 'react';

import {
  cancelDailyReminder,
  cancelWeeklySummary,
  scheduleDailyReminder,
  scheduleWeeklySummary,
} from '@/services/notifications';
import { useSettingsStore } from '@/store/settingsStore';

/**
 * Headless: keeps the scheduled local notifications in sync with the user's
 * settings. Re-scheduling uses stable identifiers, so this is idempotent across
 * app launches. Mounted once in `App.tsx`.
 */
export function NotificationManager() {
  const dailyReminder = useSettingsStore((s) => s.notifDailyReminder);
  const weeklySummary = useSettingsStore((s) => s.notifWeeklySummary);

  useEffect(() => {
    if (dailyReminder) void scheduleDailyReminder();
    else void cancelDailyReminder();
  }, [dailyReminder]);

  useEffect(() => {
    if (weeklySummary) void scheduleWeeklySummary();
    else void cancelWeeklySummary();
  }, [weeklySummary]);

  return null;
}
