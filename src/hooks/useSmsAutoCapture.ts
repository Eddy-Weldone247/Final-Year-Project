import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import * as transactionApi from '@/api/transaction.api';
import { notifySmsImported } from '@/services/appNotifications';
import { onTransactionCreated } from '@/services/notifications';
import { computeFingerprint, filterDuplicates, logDuplicates } from '@/services/sms/dedupe';
import { parseMany } from '@/services/sms/parser';
import { isSmsReadingAvailable, readInbox } from '@/services/sms/smsReader';
import { toCreatePayload } from '@/services/sms/toTransaction';
import { useAuthStore } from '@/store/authStore';
import { useImportedSmsStore } from '@/store/importedSmsStore';
import { useSettingsStore } from '@/store/settingsStore';

const LOOKBACK_DAYS = 3;
const POLL_MS = 60_000;

/**
 * Opt-in auto-capture: while enabled, scans the inbox on app launch, on
 * foreground, and on an interval, creating transactions for any new financial
 * SMS (deduped). Reuses the same reader + parser as the manual importer.
 * No-op in Expo Go (SMS reading unavailable).
 */
export function useSmsAutoCapture() {
  const enabled = useSettingsStore((state) => state.autoCaptureSms);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const markImported = useImportedSmsStore((state) => state.markImported);
  const queryClient = useQueryClient();
  const running = useRef(false);

  useEffect(() => {
    if (!enabled || !isAuthenticated || !isSmsReadingAvailable()) return;

    const run = async () => {
      if (running.current) return;
      running.current = true;
      try {
        const sinceMs = Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000;
        const messages = await readInbox({ maxCount: 100, sinceMs });
        const { importedIds, importedFingerprints } = useImportedSmsStore.getState();
        const { unique: fresh, duplicates } = filterDuplicates(parseMany(messages), {
          importedIds,
          importedFingerprints,
        });
        logDuplicates(duplicates);
        if (fresh.length === 0) return;

        const created: string[] = [];
        const fingerprints: string[] = [];
        for (const candidate of fresh) {
          try {
            const tx = await transactionApi.createTransaction(toCreatePayload(candidate));
            onTransactionCreated(tx);
            notifySmsImported(candidate.provider);
            created.push(candidate.smsId);
            fingerprints.push(computeFingerprint(candidate));
          } catch {
            // Skip this one; a later run will retry it.
          }
        }
        if (created.length > 0) {
          markImported(created, fingerprints);
          queryClient.invalidateQueries({ queryKey: ['transactions'] });
        }
      } catch {
        // Permission/availability issues — silently skip.
      } finally {
        running.current = false;
      }
    };

    void run();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void run();
    });
    const interval = setInterval(() => void run(), POLL_MS);

    return () => {
      subscription.remove();
      clearInterval(interval);
    };
  }, [enabled, isAuthenticated, markImported, queryClient]);
}
