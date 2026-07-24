import { extractAmount } from './amount';
import { guessCategory } from './category';
import { extractDate } from './date';
import { extractMerchant } from './merchant';
import { detectProvider } from './provider';
import { detectType } from './transactionType';
import type { ParsedSms, SmsMessage } from './types';
import { isFinancialSms } from './validator';

/**
 * SMS → transaction parsing pipeline (orchestrator).
 *
 * Runs each stage in order, short-circuiting to `null` (drop the SMS) as soon as
 * a gate fails. Every stage is a self-contained, independently-tested module:
 *   validate → provider → type → amount → merchant → category → date.
 */

/** Parses a single SMS into transaction fields, or null if it isn't financial. */
export function parseSms(sms: SmsMessage): ParsedSms | null {
  // 1. Validation gate: reject OTPs, promos, delivery/recharge, lottery, etc.
  if (!isFinancialSms(sms)) return null;

  // 2. Provider (sender) — must be a recognised financial institution.
  const provider = detectProvider(sms);
  if (!provider) return null;

  // 3. Direction — income/expense (or null when no money-movement signal).
  const type = detectType(sms.body);
  if (!type) return null;

  // 4. Amount — the real transaction amount (never a balance/fee/OTP/phone no.).
  const extracted = extractAmount(sms.body, provider);
  if (!extracted || extracted.amount <= 0) return null;

  // 5. Merchant, 6. category, 7. date.
  const merchant = extractMerchant(sms.body, type);
  return {
    smsId: sms.id,
    provider,
    type,
    amount: extracted.amount,
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
