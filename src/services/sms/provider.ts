import { BANK_RE, PROVIDER_HINTS } from './patterns';
import type { SmsMessage, SmsProvider } from './types';

/**
 * Named banks and card networks (sender or body). Complements the structural
 * `BANK_RE` so alerts from a recognised institution — Ecobank, Absa, Stanbic,
 * GTBank, Visa, Mastercard, … — are attributed to the generic `Bank` provider.
 * `bank` is matched as a substring because sender ids concatenate ("GTBank",
 * "CalBank"). Non-transaction bank messages are already dropped by the validator
 * (which runs before provider detection), so broad recognition here is safe.
 */
const BANK_OR_CARD_RE =
  /(bank|ecobank|absa|stanbic|\bgcb\b|calbank|fidelity|zenith|chartered|stanchart|\badb\b|\buba\b|prudential|omnibsic|societe\s*generale|\bvisa\b|master\s*card|mastercard|amex|american\s*express)/i;

/**
 * SMS provider detection.
 *
 * Identifies the financial institution behind a message from its sender address
 * and body (MTN MoMo / Telecel Cash / AirtelTigo Cash, or a bank / card network
 * → generic `Bank`). Returns `null` when the sender is not a recognised
 * financial source.
 */
export function detectProvider(sms: SmsMessage): SmsProvider | null {
  const haystack = `${sms.address} ${sms.body}`;
  for (const hint of PROVIDER_HINTS) {
    if (hint.re.test(haystack)) return hint.provider;
  }
  if (BANK_RE.test(sms.body) || BANK_OR_CARD_RE.test(haystack)) return 'Bank';
  return null;
}
