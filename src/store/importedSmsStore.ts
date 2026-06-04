import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface ImportedSmsState {
  /** SMS ids already turned into transactions (to avoid duplicates). */
  importedIds: string[];
  markImported: (ids: string[]) => void;
}

/** Persists which SMS messages have already been imported. */
export const useImportedSmsStore = create<ImportedSmsState>()(
  persist(
    (set) => ({
      importedIds: [],
      markImported: (ids) =>
        set((state) => ({ importedIds: Array.from(new Set([...state.importedIds, ...ids])) })),
    }),
    {
      name: 'expensee-imported-sms',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
