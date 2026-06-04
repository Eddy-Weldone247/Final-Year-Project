import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface SettingsState {
  /** When on, new financial SMS are imported automatically (foreground). */
  autoCaptureSms: boolean;
  setAutoCaptureSms: (value: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      autoCaptureSms: false,
      setAutoCaptureSms: (value) => set({ autoCaptureSms: value }),
    }),
    {
      name: 'expensee-settings',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
