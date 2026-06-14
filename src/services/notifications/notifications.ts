import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { formatCurrency } from '@/utils/formatCurrency';

/**
 * Local notification primitives (Expo Go-safe — no push tokens / FCM).
 *
 * - `notifyMoneyIn` / `notifyBudgetAlert` present an immediate notification in
 *   response to something happening while the app runs.
 * - `scheduleDailyReminder` / `scheduleWeeklySummary` register repeating local
 *   notifications with stable identifiers (re-scheduling replaces, so they're
 *   idempotent). Their content is static — set at schedule time.
 */

const DAILY_REMINDER_ID = 'daily-expense-reminder';
const WEEKLY_SUMMARY_ID = 'weekly-summary';
const CHANNEL_ID = 'default';

/** Default schedule times (24h). Daily 8 PM; weekly Sunday 6 PM. */
export const NOTIF_SCHEDULE = {
  dailyHour: 20,
  dailyMinute: 0,
  weeklyWeekday: 1, // 1 = Sunday
  weeklyHour: 18,
  weeklyMinute: 0,
} as const;

let configured = false;

/** Installs the foreground handler + Android channel. Safe to call repeatedly. */
export async function configureNotifications(): Promise<void> {
  if (configured) return;
  configured = true;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: 'ExpenSee',
        importance: Notifications.AndroidImportance.DEFAULT,
        lightColor: '#2563eb',
      });
    } catch {
      // Channel setup unavailable (e.g. web) — ignore.
    }
  }
}

/** Requests permission if needed; resolves to whether notifications are allowed. */
export async function ensureNotificationPermission(): Promise<boolean> {
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    if (current.status === 'denied' && !current.canAskAgain) return false;
    const next = await Notifications.requestPermissionsAsync();
    return next.granted;
  } catch {
    return false;
  }
}

async function presentNow(title: string, body: string): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: null,
    });
  } catch {
    // Notifications unavailable / not permitted — fail quietly.
  }
}

/** "💰 Money received" — fired when an income transaction is recorded. */
export async function notifyMoneyIn(amount: number, source?: string | null): Promise<void> {
  const money = formatCurrency(amount);
  const body = source ? `${money} • ${source}` : `${money} was added to your account.`;
  await presentNow('💰 Money received', body);
}

/** Budget threshold alert (warning / exceeded). */
export async function notifyBudgetAlert(title: string, body: string): Promise<void> {
  await presentNow(title, body);
}

export async function scheduleDailyReminder(
  hour: number = NOTIF_SCHEDULE.dailyHour,
  minute: number = NOTIF_SCHEDULE.dailyMinute,
): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_ID);
    await Notifications.scheduleNotificationAsync({
      identifier: DAILY_REMINDER_ID,
      content: {
        title: '📒 Track your spending',
        body: "Take a moment to log today's expenses so nothing slips through.",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        channelId: CHANNEL_ID,
      },
    });
  } catch {
    // ignore
  }
}

export async function scheduleWeeklySummary(
  weekday: number = NOTIF_SCHEDULE.weeklyWeekday,
  hour: number = NOTIF_SCHEDULE.weeklyHour,
  minute: number = NOTIF_SCHEDULE.weeklyMinute,
): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(WEEKLY_SUMMARY_ID);
    await Notifications.scheduleNotificationAsync({
      identifier: WEEKLY_SUMMARY_ID,
      content: {
        title: '📊 Your weekly summary',
        body: 'See how your income and spending went this week.',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday,
        hour,
        minute,
        channelId: CHANNEL_ID,
      },
    });
  } catch {
    // ignore
  }
}

export async function cancelDailyReminder(): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_ID);
  } catch {
    // not scheduled — ignore
  }
}

export async function cancelWeeklySummary(): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(WEEKLY_SUMMARY_ID);
  } catch {
    // not scheduled — ignore
  }
}
