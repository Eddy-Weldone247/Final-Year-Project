import { hasCurrencyAmount } from './amount';
import { CREDIT_RE, DEBIT_RE, PROVIDER_HINTS, BANK_RE } from './patterns';
import type { SmsMessage } from './types';

/**
 * SMS financial-transaction validation layer.
 *
 * Gatekeeper that runs BEFORE any parsing/extraction. Its only job is to decide
 * whether an SMS is a genuine financial transaction alert (MTN MoMo, Telecel
 * Cash, AirtelTigo Money, bank / Visa / Mastercard alerts) so that OTPs,
 * verification codes, promotions, delivery notices, recharge confirmations,
 * lottery/spam and general notifications never reach the extractor (which would
 * otherwise pull random numbers out as "amounts").
 *
 * It produces a transparent CONFIDENCE SCORE (0..1) from weighted sender /
 * keyword / pattern signals. Messages scoring below the threshold are ignored
 * completely. Scoring — rather than a naive keyword blacklist — is deliberate:
 * real bank alerts often carry a safety footer ("never share your OTP/PIN"),
 * and a blacklist would wrongly drop them. Here, strong transactional structure
 * (currency amount + debit/credit + running balance) outweighs an incidental
 * spam term, while a bare OTP/promo with no financial structure is rejected.
 */

/** Default confidence needed to treat an SMS as a real transaction. */
export const DEFAULT_CONFIDENCE_THRESHOLD = 0.5;

/** A running / available balance — almost every real transaction alert states one. */
const BALANCE_RE =
  /\b(?:avail(?:able)?\s*(?:bal|balance)|new\s*bal(?:ance)?|cur(?:rent)?\s*bal|bal(?:ance)?)\b/i;

/**
 * "Core" money-movement verbs (a strict subset of the parser's DEBIT/CREDIT
 * patterns, excluding soft tokens like "airtime"/"bundle"/"bill"). Used only to
 * recognise genuine transaction structure so a spam term inside a real alert's
 * safety footer ("never share your OTP") is treated leniently.
 */
const CORE_DIRECTION_RE =
  /\b(debit(?:ed)?|credit(?:ed)?|receiv(?:e|ed)|sent|withdraw(?:n|al)?|deposit(?:ed)?|paid|payment|transfer(?:red)?|purchase[d]?|refund(?:ed)?|cash\s*(?:in|out))\b/i;

/**
 * Positive transaction vocabulary (money moved / wallet / card language).
 * Presence — not per-word count — is scored, to avoid runaway from repetition.
 */
const TRANSACTION_VOCAB_RE =
  /\b(debit(?:ed)?|credit(?:ed)?|receiv(?:e|ed)|transfer(?:red)?|sent|withdraw(?:n|al)?|deposit(?:ed)?|payment|paid|purchase[d]?|cash\s*out|cash\s*in|mobile\s*money|momo|txn\s*id|transaction\s*id|trans(?:action)?\s*(?:id|ref)|reference|ref(?:erence)?\s*(?:no|#)|pos\s*(?:purchase|payment)|visa|mastercard|card\s*(?:ending|no|payment|purchase)|e-?levy|wallet)\b/i;

/** Provider / financial-institution sender addresses we trust. */
const FINANCIAL_SENDER_RE =
  /(mtn|momo|mobile\s*money|telecel|vodafone|voda\s*cash|airtel|tigo|at\s*money|bank|cash|money|pay|visa|mastercard)/i;

/**
 * Hard spam / non-transaction terms. When present WITHOUT strong transactional
 * structure they force a reject. When present WITH strong structure (e.g. a bank
 * alert's "do not share your OTP" footer) they only apply a mild penalty.
 */
const HARD_SPAM_RE =
  /\b(otp|one[-\s]?time\s*(?:password|pin|code)|verification\s*code|verify\s*(?:your|code)|security\s*code|activation\s*code|confirmation\s*code|password|promo(?:tion|tional)?|bonus|voucher|coupon|lottery|jackpot|congratulation(?:s)?|you\s*(?:have\s*)?won|winner|claim\s*(?:your|now)|unsubscribe|prize|reward\s*points?|% ?off|discount|recharg(?:e|ed|es|ing))\b/i;

/**
 * Softer non-transaction terms (delivery notices, bare "code", generic
 * offers / activation / subscriptions). Penalised, not hard-blocked.
 */
const SOFT_SPAM_RE =
  /\b(offer|delivery|deliver(?:ed|y)?|activat(?:e|ion)|subscribe|subscription|data\s*bundle\s*offer|gift|code)\b/i;

/** Signal weights (positive contributions to confidence). */
const WEIGHTS = {
  currency: 0.35,
  direction: 0.25,
  balance: 0.15,
  vocab: 0.2,
  sender: 0.15,
} as const;

/** Result of validating a single SMS. */
export interface SmsValidation {
  /** Whether the SMS is a genuine financial transaction (confidence ≥ threshold). */
  isFinancial: boolean;
  /** Confidence score in the range 0..1. */
  confidence: number;
  /** The threshold this result was evaluated against. */
  threshold: number;
  /** Human-readable signals that contributed — for logging / debugging. */
  reasons: string[];
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

/**
 * Scores an SMS and decides whether it is a genuine financial transaction.
 *
 * @param sms The raw SMS (sender address + body).
 * @param threshold Minimum confidence to accept (defaults to
 *   {@link DEFAULT_CONFIDENCE_THRESHOLD}).
 */
export function validateSms(
  sms: SmsMessage,
  threshold: number = DEFAULT_CONFIDENCE_THRESHOLD,
): SmsValidation {
  const body = sms.body ?? '';
  const address = sms.address ?? '';
  const senderHaystack = `${address} ${body}`;
  const reasons: string[] = [];

  // --- Positive signals ---
  const hasCurrency = hasCurrencyAmount(body);
  const hasBalance = BALANCE_RE.test(body);
  const hasCoreDirection = CORE_DIRECTION_RE.test(body);

  let positive = 0;

  if (hasCurrency) {
    positive += WEIGHTS.currency;
    reasons.push('currency-amount');
  }
  if (CREDIT_RE.test(body) || DEBIT_RE.test(body)) {
    positive += WEIGHTS.direction;
    reasons.push('debit/credit-direction');
  }
  if (hasBalance) {
    positive += WEIGHTS.balance;
    reasons.push('balance');
  }
  if (TRANSACTION_VOCAB_RE.test(body)) {
    positive += WEIGHTS.vocab;
    reasons.push('transaction-vocab');
  }
  if (
    FINANCIAL_SENDER_RE.test(address) ||
    PROVIDER_HINTS.some((h) => h.re.test(senderHaystack)) ||
    BANK_RE.test(body)
  ) {
    positive += WEIGHTS.sender;
    reasons.push('trusted-sender');
  }

  positive = clamp01(positive);

  // A message is "structurally a real transaction" only when it has a currency
  // amount, a running balance AND a core money-movement verb (debited/credited/
  // received/sent…). This — not sender or amount alone — is what earns a spam
  // term leniency, so a genuine alert's "never share your OTP/PIN" footer is
  // tolerated while a promo that merely mentions an amount is not.
  const strong = hasCurrency && hasBalance && hasCoreDirection;

  // --- Negative signals (penalties) ---
  let penalty = 0;
  if (HARD_SPAM_RE.test(body)) {
    // Full penalty unless the message is clearly a transaction (footer case).
    penalty += strong ? 0.15 : 0.7;
    reasons.push(strong ? 'spam-term(footer)' : 'spam-term');
  }
  if (SOFT_SPAM_RE.test(body)) {
    penalty += strong ? 0.1 : 0.35;
    reasons.push('non-transaction-term');
  }

  const confidence = clamp01(positive - penalty);
  return {
    isFinancial: confidence >= threshold,
    confidence: Math.round(confidence * 100) / 100,
    threshold,
    reasons,
  };
}

/**
 * Convenience boolean gate: `true` only when the SMS is a genuine financial
 * transaction at/above the confidence threshold.
 */
export function isFinancialSms(
  sms: SmsMessage,
  threshold: number = DEFAULT_CONFIDENCE_THRESHOLD,
): boolean {
  return validateSms(sms, threshold).isFinancial;
}
