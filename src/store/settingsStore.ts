import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface SettingsState {
  /** When on, new financial SMS are imported automatically (foreground). */
  autoCaptureSms: boolean;
  setAutoCaptureSms: (value: boolean) => void;

  /** Notify when an income transaction is recorded. */
  notifMoneyIn: boolean;
  setNotifMoneyIn: (value: boolean) => void;
  /** Daily reminder to log expenses. */
  notifDailyReminder: boolean;
  setNotifDailyReminder: (value: boolean) => void;
  /** Alert when spending crosses a budget threshold. */
  notifBudgetAlerts: boolean;
  setNotifBudgetAlerts: (value: boolean) => void;
  /** Weekly spending-summary reminder. */
  notifWeeklySummary: boolean;
  setNotifWeeklySummary: (value: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      autoCaptureSms: false,
      setAutoCaptureSms: (value) => set({ autoCaptureSms: value }),

      notifMoneyIn: false,
      setNotifMoneyIn: (value) => set({ notifMoneyIn: value }),
      notifDailyReminder: false,
      setNotifDailyReminder: (value) => set({ notifDailyReminder: value }),
      notifBudgetAlerts: false,
      setNotifBudgetAlerts: (value) => set({ notifBudgetAlerts: value }),
      notifWeeklySummary: false,
      setNotifWeeklySummary: (value) => set({ notifWeeklySummary: value }),
    }),
    {
      name: 'expensee-settings',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
