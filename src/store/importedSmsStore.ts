import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface ImportedSmsState {
  /** SMS ids already turned into transactions (to avoid duplicates). */
  importedIds: string[];
  /** Content fingerprints of imported transactions (catches re-sent/duplicate SMS). */
  importedFingerprints: string[];
  markImported: (ids: string[], fingerprints?: string[]) => void;
}

/** Persists which SMS messages have already been imported (by id and fingerprint). */
export const useImportedSmsStore = create<ImportedSmsState>()(
  persist(
    (set) => ({
      importedIds: [],
      importedFingerprints: [],
      markImported: (ids, fingerprints = []) =>
        set((state) => ({
          importedIds: Array.from(new Set([...state.importedIds, ...ids])),
          importedFingerprints: Array.from(
            new Set([...state.importedFingerprints, ...fingerprints]),
          ),
        })),
    }),
    {
      name: 'expensee-imported-sms',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
