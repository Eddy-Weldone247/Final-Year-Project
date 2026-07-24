import type { TransactionType } from '@/types/transaction';

/**
 * SMS transaction-type detection layer.
 *
 * Determines the nature of a transaction from sender keywords and transaction
 * language. Two levels:
 *   • `SmsTransactionType` — a rich label set (Income, Expense, Transfer,
 *     Withdrawal, Deposit, Refund, Cash Out, Cash In) driven by configurable
 *     keyword rules.
 *   • `TransactionType` — the app's stored domain type (`INCOME` | `EXPENSE`).
 *     Each rich type maps onto it via {@link smsTypeToDomain} (money-in →
 *     INCOME, money-out → EXPENSE; Transfer is resolved by direction words).
 *
 * Detection is a first-match scan over an ORDERED rule list, so specific types
 * (Refund, Withdrawal, Cash Out/In, Deposit, Transfer) are matched before the
 * generic Income/Expense language. Returns `null` when no direction signal is
 * found, so `parseSms` still drops non-transaction messages.
 */

/** Rich transaction types detected from SMS language. */
export type SmsTransactionType =
  | 'Income'
  | 'Expense'
  | 'Transfer'
  | 'Withdrawal'
  | 'Deposit'
  | 'Refund'
  | 'Cash Out'
  | 'Cash In';

/** A single keyword→type rule. */
export interface TypeRule {
  type: SmsTransactionType;
  /** Keyword matcher (case-insensitive, word-boundaried where safe). */
  re: RegExp;
}

/**
 * Default, ORDERED type rules. Order matters — first match wins, so specific
 * money-movement types precede the generic Income/Expense language. Income is
 * placed before Expense so a "received"/"credited" alert wins over an incidental
 * "payment"/"paid" mention (matching the previous credit-before-debit priority).
 * Override or extend to configure detection.
 */
export const DEFAULT_TYPE_RULES: TypeRule[] = [
  { type: 'Refund', re: /\b(refund(?:ed)?|reversal|reversed|charge\s*back|chargeback)\b/i },
  { type: 'Withdrawal', re: /\b(withdraw(?:al|n|s)?|atm\s*withdraw\w*)\b/i },
  { type: 'Cash Out', re: /\b(cash\s*out|cashout)\b/i },
  { type: 'Cash In', re: /\b(cash\s*in|cashin)\b/i },
  {
    type: 'Deposit',
    re: /\b(deposit(?:ed)?|cash\s*deposit|paid\s*in(?:to)?|lodg(?:e|ed|ment))\b/i,
  },
  { type: 'Transfer', re: /\b(transfer(?:red)?|remittance|money\s*transfer|funds?\s*transfer)\b/i },
  {
    type: 'Income',
    re: /\b(receiv(?:e|ed)|credit(?:ed)?|salary|payroll|\bpaid\s*to\s*you\b|money\s*in|\bincome\b|earnings?)\b/i,
  },
  {
    type: 'Expense',
    re: /\b(paid|payment|debit(?:ed)?|sent|purchase[d]?|spent|bought|pos\s*(?:purchase|payment)|charged?|airtime|bundle|\bbill\b)\b/i,
  },
];

/** Rich types that mean money came IN. */
const INCOME_TYPES: ReadonlySet<SmsTransactionType> = new Set([
  'Income',
  'Deposit',
  'Cash In',
  'Refund',
]);

/** Rich types that mean money went OUT. */
const EXPENSE_TYPES: ReadonlySet<SmsTransactionType> = new Set([
  'Expense',
  'Withdrawal',
  'Cash Out',
]);

/** Inbound direction words (used to resolve an ambiguous Transfer). */
const INBOUND_RE = /\b(receiv(?:e|ed)|credit(?:ed)?|from|into\s*your)\b/i;
/** Outbound direction words. */
const OUTBOUND_RE = /\b(sent|debit(?:ed)?|paid|\bto\b)\b/i;

/**
 * Classifies an SMS body into a rich {@link SmsTransactionType}, or `null` when
 * no money-direction signal is present.
 *
 * @param body The SMS body.
 * @param rules Ordered rules to use (defaults to {@link DEFAULT_TYPE_RULES}).
 */
export function classifyTransactionType(
  body: string,
  rules: TypeRule[] = DEFAULT_TYPE_RULES,
): SmsTransactionType | null {
  for (const { type, re } of rules) {
    if (re.test(body)) return type;
  }
  return null;
}

/**
 * Maps a rich {@link SmsTransactionType} to the stored domain
 * {@link TransactionType}. Transfer is resolved from direction words in `body`
 * (inbound → INCOME, otherwise outbound → EXPENSE).
 */
export function smsTypeToDomain(type: SmsTransactionType, body: string): TransactionType {
  if (INCOME_TYPES.has(type)) return 'INCOME';
  if (EXPENSE_TYPES.has(type)) return 'EXPENSE';
  // Transfer: inbound only (received/from, and not explicitly sent) → INCOME.
  if (INBOUND_RE.test(body) && !OUTBOUND_RE.test(body)) return 'INCOME';
  return 'EXPENSE';
}

/**
 * Detects the domain {@link TransactionType} of a transaction SMS, or `null`
 * when it carries no direction signal. Signature-compatible with the parser's
 * previous `detectType`.
 *
 * @param body The SMS body.
 * @param rules Optional custom rules for configurable detection.
 */
export function detectType(
  body: string,
  rules: TypeRule[] = DEFAULT_TYPE_RULES,
): TransactionType | null {
  const rich = classifyTransactionType(body, rules);
  return rich ? smsTypeToDomain(rich, body) : null;
}
