import type { SmsProvider } from './types';

/**
 * Shared, cross-cutting patterns used by more than one pipeline stage. Stage-
 * specific patterns live in their own module (amounts → `amount.ts`, categories
 * → `category.ts`, types → `transactionType.ts`, merchant → `merchant.ts`).
 */

/** Words that mean money came IN (income) — used by the validator's signal check. */
export const CREDIT_RE =
  /\b(receiv(?:e|ed)|credit(?:ed)?|deposit(?:ed)?|refund(?:ed)?|reversal|reversed|cash\s*in|salary)\b/i;

/** Words that mean money went OUT (expense) — used by the validator's signal check. */
export const DEBIT_RE =
  /\b(sent|debit(?:ed)?|payment|paid|purchase[d]?|withdraw(?:n|al)?|transfer(?:red)?|spent|airtime|bundle|bill|cash\s*out|charged?)\b/i;

/**
 * Sender-address / content hints used to detect the provider. No word
 * boundaries — SMS sender IDs are often concatenated (e.g. "MTNMobileMoney").
 */
export const PROVIDER_HINTS: { provider: SmsProvider; re: RegExp }[] = [
  { provider: 'MTN MoMo', re: /(mtn|momo|mobile\s*money)/i },
  { provider: 'Telecel Cash', re: /(telecel|vodafone|voda\s*cash)/i },
  { provider: 'AirtelTigo Cash', re: /(airteltigo|at\s*money|tigo\s*cash|airtel\s*money)/i },
];

/** Bank alert heuristics (sender codes vary too much to enumerate). */
export const BANK_RE =
  /((a\/c|acct|account)\b[^.]*\b(debit|credit|bal|balance))|((debit|credit)\s*alert)|pos\s*(purchase|payment)/i;

/** Stop tokens that terminate a captured merchant/counterparty name. */
export const MERCHANT_STOP_RE =
  /\b(on|current|new|avail\w*|ref\w*|fee\w*|transaction|trans|txn|id|bal|balance|your|with|successful|wallet|account)\b/i;
