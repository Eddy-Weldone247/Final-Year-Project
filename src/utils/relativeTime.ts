import { formatDate } from '@/utils/formatCurrency';

/** 12-hour clock time, e.g. "10:20 AM" (no Intl — Hermes lacks full ICU). */
function clockTime(d: Date): string {
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, '0')} ${ampm}`;
}

function startOfDay(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/**
 * Human timestamp for a notification: "Today • 10:20 AM", "Yesterday", or a
 * short date for anything older.
 */
export function formatNotificationTime(ts: number, now: number = Date.now()): string {
  const days = Math.round((startOfDay(now) - startOfDay(ts)) / 86_400_000);
  if (days <= 0) return `Today • ${clockTime(new Date(ts))}`;
  if (days === 1) return 'Yesterday';
  return formatDate(new Date(ts).toISOString());
}
