import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface OnboardingState {
  hasOnboarded: boolean;
  /** True once the persisted flag has been read from storage. */
  hasHydrated: boolean;
  setOnboarded: () => void;
  setHasHydrated: (value: boolean) => void;
}

/** Tracks whether the first-launch onboarding has been completed/skipped. */
export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      hasOnboarded: false,
      hasHydrated: false,
      setOnboarded: () => set({ hasOnboarded: true }),
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: 'expensee-onboarding',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ hasOnboarded }) => ({ hasOnboarded }),
      onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
    },
  ),
);
