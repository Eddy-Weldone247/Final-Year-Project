import { useCallback, useState } from 'react';

import { filterDuplicates, logDuplicates } from '@/services/sms/dedupe';
import { parseMany } from '@/services/sms/parser';
import { isSmsReadingAvailable, readInbox, requestSmsPermission } from '@/services/sms/smsReader';
import type { ParsedSms } from '@/services/sms/types';
import { useImportedSmsStore } from '@/store/importedSmsStore';
import { getErrorMessage } from '@/utils/getErrorMessage';

export type SmsImportStatus = 'idle' | 'unavailable' | 'scanning' | 'denied' | 'ready' | 'error';

const LOOKBACK_DAYS = 90;

/** Orchestrates: availability → permission → read inbox → parse → dedupe. */
export function useSmsImport() {
  const [status, setStatus] = useState<SmsImportStatus>(
    isSmsReadingAvailable() ? 'idle' : 'unavailable',
  );
  const [candidates, setCandidates] = useState<ParsedSms[]>([]);
  const [error, setError] = useState<string | null>(null);
  const importedIds = useImportedSmsStore((state) => state.importedIds);
  const importedFingerprints = useImportedSmsStore((state) => state.importedFingerprints);

  const scan = useCallback(async () => {
    setError(null);
    if (!isSmsReadingAvailable()) {
      setStatus('unavailable');
      return;
    }
    const granted = await requestSmsPermission();
    if (!granted) {
      setStatus('denied');
      return;
    }
    setStatus('scanning');
    try {
      const sinceMs = Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000;
      const messages = await readInbox({ maxCount: 500, sinceMs });
      const { unique, duplicates } = filterDuplicates(parseMany(messages), {
        importedIds,
        importedFingerprints,
      });
      logDuplicates(duplicates);
      setCandidates(unique);
      setStatus('ready');
    } catch (e) {
      setError(getErrorMessage(e));
      setStatus('error');
    }
  }, [importedIds, importedFingerprints]);

  return { status, candidates, error, scan };
}
