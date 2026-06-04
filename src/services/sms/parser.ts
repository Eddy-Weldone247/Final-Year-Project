import type { Category, TransactionType } from '@/types/transaction';

import {
  AMOUNT_PREFIX_RE,
  AMOUNT_SUFFIX_RE,
  BANK_RE,
  CATEGORY_KEYWORDS,
  CREDIT_RE,
  DEBIT_RE,
  FEE_CONTEXT_RE,
  MERCHANT_STOP_RE,
  PROVIDER_HINTS,
} from './patterns';
import type { ParsedSms, SmsMessage, SmsProvider } from './types';

const MONTHS: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

/** Detects the financial provider from the sender address and message body. */
export function detectProvider(sms: SmsMessage): SmsProvider | null {
  const haystack = `${sms.address} ${sms.body}`;
  for (const hint of PROVIDER_HINTS) {
    if (hint.re.test(haystack)) return hint.provider;
  }
  if (BANK_RE.test(sms.body)) return 'Bank';
  return null;
}

/** INCOME if the message indicates money in, EXPENSE if out, else null. */
export function detectType(body: string): TransactionType | null {
  if (CREDIT_RE.test(body)) return 'INCOME';
  if (DEBIT_RE.test(body)) return 'EXPENSE';
  return null;
}

/**
 * Extracts the primary transaction amount, skipping amounts that are clearly a
 * fee or a balance (based on the words immediately preceding them).
 */
export function extractAmount(body: string): number | null {
  const found: { value: number; index: number; isFee: boolean }[] = [];

  for (const re of [AMOUNT_PREFIX_RE, AMOUNT_SUFFIX_RE]) {
    re.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = re.exec(body)) !== null) {
      const raw = match[1];
      if (!raw) continue;
      const preceding = body.slice(Math.max(0, match.index - 14), match.index);
      found.push({
        value: parseFloat(raw.replace(/,/g, '')),
        index: match.index,
        isFee: FEE_CONTEXT_RE.test(preceding),
      });
    }
  }

  if (found.length === 0) return null;
  found.sort((a, b) => a.index - b.index);
  const primary = found.find((f) => !f.isFee) ?? found[0];
  return primary && Number.isFinite(primary.value) ? primary.value : null;
}

/** Pulls the counterparty/merchant name after "to"/"at" (out) or "from" (in). */
export function extractMerchant(body: string, type: TransactionType): string | null {
  const keywords = type === 'INCOME' ? ['from'] : ['to', 'at', 'from'];
  for (const keyword of keywords) {
    const re = new RegExp(`\\b${keyword}\\s+([A-Za-z0-9][A-Za-z0-9 &.'\\/-]{1,40})`, 'i');
    const match = body.match(re);
    if (match?.[1]) {
      const cleaned = cleanMerchant(match[1]);
      if (cleaned) return cleaned;
    }
  }
  return null;
}

function cleanMerchant(value: string): string {
  // Stop at the first punctuation or stop-word, then tidy whitespace.
  let result = value.split(/[.,;:()\n]/)[0] ?? value;
  const stop = result.search(MERCHANT_STOP_RE);
  if (stop > 0) result = result.slice(0, stop);
  return result.trim().replace(/\s{2,}/g, ' ');
}

/** Finds an explicit date in the body, falling back to the received time. */
export function extractDate(body: string, fallbackMs: number): string {
  // dd-MMM-yyyy / dd MMM yyyy (e.g. 01-Jun-2026)
  let m = body.match(/\b(\d{1,2})[-/ ]([A-Za-z]{3,9})[-/ ](\d{2,4})\b/);
  if (m && m[1] && m[2] && m[3]) {
    const month = MONTHS[m[2].slice(0, 3).toLowerCase()];
    if (month !== undefined) return isoDate(fullYear(m[3]), month, Number(m[1]));
  }
  // yyyy-mm-dd
  m = body.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (m && m[1] && m[2] && m[3]) return isoDate(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  // dd-mm-yyyy / dd/mm/yyyy
  m = body.match(/\b(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})\b/);
  if (m && m[1] && m[2] && m[3]) return isoDate(fullYear(m[3]), Number(m[2]) - 1, Number(m[1]));
  return new Date(fallbackMs).toISOString();
}

function fullYear(raw: string): number {
  const n = Number(raw);
  return raw.length <= 2 ? 2000 + n : n;
}

function isoDate(year: number, monthIndex: number, day: number): string {
  return new Date(Date.UTC(year, monthIndex, day)).toISOString();
}

/** Guesses a category from the merchant and body keywords (defaults to OTHERS). */
export function guessCategory(body: string, merchant: string | null): Category {
  const haystack = `${merchant ?? ''} ${body}`;
  for (const { category, re } of CATEGORY_KEYWORDS) {
    if (re.test(haystack)) return category;
  }
  return 'OTHERS';
}

/** Parses a single SMS into transaction fields, or null if it isn't financial. */
export function parseSms(sms: SmsMessage): ParsedSms | null {
  const provider = detectProvider(sms);
  if (!provider) return null;

  const type = detectType(sms.body);
  if (!type) return null;

  const amount = extractAmount(sms.body);
  if (amount === null || amount <= 0) return null;

  const merchant = extractMerchant(sms.body, type);
  return {
    smsId: sms.id,
    provider,
    type,
    amount,
    category: guessCategory(sms.body, merchant),
    merchant,
    date: extractDate(sms.body, sms.date),
    raw: sms.body,
  };
}

/** Parses many messages, dropping any that aren't recognized transactions. */
export function parseMany(messages: SmsMessage[]): ParsedSms[] {
  return messages.map(parseSms).filter((parsed): parsed is ParsedSms => parsed !== null);
}
