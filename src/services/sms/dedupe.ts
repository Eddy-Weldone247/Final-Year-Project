import type { ParsedSms } from './types';

/**
 * SMS duplicate-detection layer.
 *
 * Prevents the same transaction being imported twice. The native SMS id alone
 * is not enough — the identical transaction can arrive as a different id (a
 * re-sent alert, a bank + wallet copy), or the id set can be cleared while the
 * transaction is already saved. So each parsed SMS is reduced to a content
 * FINGERPRINT built from the fields that identify a transaction:
 *   • Reference number (when present — the strongest signal)
 *   • Amount
 *   • Timestamp (bucketed to the minute)
 *   • Sender / provider
 *   • Merchant / counterparty
 *
 * Detection is a single O(n) pass over `Set` lookups, so it stays fast on large
 * inboxes. Duplicates are skipped and returned with a human-readable reason for
 * logging. This module reads `ParsedSms.raw` only to derive a reference for the
 * fingerprint — it does not change any parser extraction.
 */

/** Reference / transaction-id patterns used only to strengthen the fingerprint. */
const REFERENCE_RE =
  /\b(?:financial\s+transaction\s+id|transaction\s+id|txn\s*id|trans(?:action)?\s*ref(?:erence)?|reference(?:\s*(?:no|number|code))?|ref(?:\.|\s*(?:no|number))?)\b[:#\s]*([A-Za-z0-9][A-Za-z0-9-]{3,})/i;

/**
 * Extracts a transaction reference / id from raw SMS text, normalised to an
 * uppercase alphanumeric token, or `null`. Used for de-duplication only.
 */
export function extractReference(raw: string): string | null {
  const match = raw.match(REFERENCE_RE);
  const token = match?.[1]?.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  return token && token.length >= 4 ? token : null;
}

/** Bucket an ISO date/time string to the minute (`YYYY-MM-DDTHH:MM`). */
function toMinuteBucket(iso: string): string {
  const ms = Date.parse(iso);
  return Number.isNaN(ms) ? iso : new Date(ms).toISOString().slice(0, 16);
}

interface Fingerprint {
  /** The comparison key. */
  key: string;
  /** Human-readable description of what the key is based on (for logging). */
  basis: string;
}

/** Builds the fingerprint key + basis for a parsed SMS. */
function fingerprintOf(sms: ParsedSms): Fingerprint {
  const sender = sms.provider.toLowerCase();
  const amount = Number.isFinite(sms.amount) ? sms.amount.toFixed(2) : '0.00';
  const reference = extractReference(sms.raw);

  if (reference) {
    return { key: `${sender}|ref:${reference}|amt:${amount}`, basis: `reference ${reference}` };
  }

  const minute = toMinuteBucket(sms.date);
  const merchant = (sms.merchant ?? '').toLowerCase().trim() || 'unknown';
  return {
    key: `${sender}|amt:${amount}|t:${minute}|m:${merchant}`,
    basis: `amount ${amount}, ${minute}, ${sender}${merchant === 'unknown' ? '' : `, ${merchant}`}`,
  };
}

/**
 * Content fingerprint of a parsed SMS (amount + timestamp + sender + reference +
 * merchant). Two SMS with the same fingerprint represent the same transaction.
 */
export function computeFingerprint(sms: ParsedSms): string {
  return fingerprintOf(sms).key;
}

/** A candidate skipped as a duplicate, with the reason (for logging). */
export interface DuplicateSkip {
  sms: ParsedSms;
  fingerprint: string;
  reason: string;
}

/** Result of de-duplicating a batch of parsed SMS. */
export interface DedupeResult {
  /** Candidates that are new (safe to import). */
  unique: ParsedSms[];
  /** Candidates skipped as duplicates, with reasons. */
  duplicates: DuplicateSkip[];
}

/** Known-imported keys to compare against. */
export interface KnownImported {
  importedIds?: Iterable<string>;
  importedFingerprints?: Iterable<string>;
}

/**
 * Splits candidates into `unique` and `duplicates`, comparing each against the
 * already-imported ids/fingerprints AND against earlier candidates in the same
 * batch. Single pass, `Set`-backed — O(n).
 *
 * @param candidates Parsed SMS to filter.
 * @param known Previously-imported ids and fingerprints.
 */
export function filterDuplicates(candidates: ParsedSms[], known: KnownImported = {}): DedupeResult {
  const importedIds = new Set(known.importedIds ?? []);
  const importedFingerprints = new Set(known.importedFingerprints ?? []);
  const batchIds = new Set<string>();
  const batchFingerprints = new Set<string>();

  const unique: ParsedSms[] = [];
  const duplicates: DuplicateSkip[] = [];

  for (const sms of candidates) {
    const { key, basis } = fingerprintOf(sms);

    let reason: string | null = null;
    if (importedIds.has(sms.smsId)) {
      reason = `already imported (SMS id ${sms.smsId})`;
    } else if (importedFingerprints.has(key)) {
      reason = `already imported (matches ${basis})`;
    } else if (batchIds.has(sms.smsId) || batchFingerprints.has(key)) {
      reason = `duplicate within this scan (matches ${basis})`;
    }

    if (reason) {
      duplicates.push({ sms, fingerprint: key, reason });
      continue;
    }

    batchIds.add(sms.smsId);
    batchFingerprints.add(key);
    unique.push(sms);
  }

  return { unique, duplicates };
}

/** Logs skipped duplicates (dev console) so the reason is observable. */
export function logDuplicates(duplicates: DuplicateSkip[]): void {
  for (const { reason } of duplicates) {
    // eslint-disable-next-line no-console
    console.log(`[SMS dedupe] Skipping duplicate — ${reason}`);
  }
}
