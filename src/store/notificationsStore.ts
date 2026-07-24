import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/** The app events that produce an in-app notification. */
export type NotificationKind =
  | 'welcome'
  | 'expense'
  | 'sms'
  | 'budget-warning'
  | 'budget-exceeded'
  | 'prediction'
  | 'summary';

/** A stored in-app notification (icon/tone are derived from `kind` at display time). */
export interface StoredNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  message: string;
  createdAt: number;
  read: boolean;
  /** Optional key that makes an event fire at most once (e.g. a budget threshold). */
  dedupeKey?: string;
}

/** Fields supplied when raising a notification; id/createdAt/read are filled in. */
export type NewNotification = Pick<StoredNotification, 'kind' | 'title' | 'message'> &
  Partial<Pick<StoredNotification, 'dedupeKey'>>;

/** Cap the history so the store never grows without bound. */
const MAX = 50;

interface NotificationsState {
  /** Newest first. */
  notifications: StoredNotification[];
  /** Raises a notification (skipped if a `dedupeKey` duplicate already exists). */
  add: (n: NewNotification) => void;
  markRead: (id: string) => void;
}

/**
 * Persisted in-app notification feed. Populated imperatively by app events via
 * `services/appNotifications` (never generated in a background service); the
 * Notification screen simply reads it. Reuses the app's Zustand + AsyncStorage
 * pattern, so notifications survive navigation and restarts.
 */
export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set) => ({
      notifications: [],
      add: (n) =>
        set((state) => {
          if (n.dedupeKey && state.notifications.some((x) => x.dedupeKey === n.dedupeKey)) {
            return state; // already raised — no duplicate
          }
          const item: StoredNotification = {
            ...n,
            id: `${n.kind}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
            createdAt: Date.now(),
            read: false,
          };
          return { notifications: [item, ...state.notifications].slice(0, MAX) };
        }),
      markRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        })),
    }),
    {
      name: 'expensee-notifications',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
