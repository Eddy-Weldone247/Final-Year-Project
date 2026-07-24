/**
 * SMS import pipeline — public API.
 *
 * Prefer importing from `@/services/sms` over deep module paths. The pipeline is
 * a chain of single-responsibility stages, each independently testable:
 *
 *   validator → provider → transactionType → amount → merchant → category → date
 *   (parser orchestrates them; dedupe guards against re-imports)
 */

// Types
export type { SmsMessage, SmsProvider, ParsedSms } from './types';

// Orchestration
export { parseSms, parseMany } from './parser';
export { toCreatePayload } from './toTransaction';

// Stages (exposed for reuse / testing / configuration)
export { validateSms, isFinancialSms, DEFAULT_CONFIDENCE_THRESHOLD } from './validator';
export type { SmsValidation } from './validator';
export { detectProvider } from './provider';
export { detectType, classifyTransactionType, DEFAULT_TYPE_RULES } from './transactionType';
export type { SmsTransactionType, TypeRule } from './transactionType';
export { extractAmount, hasCurrencyAmount } from './amount';
export type { ExtractedAmount, CurrencyCode } from './amount';
export { extractMerchant, matchKnownEntity, KNOWN_ENTITIES } from './merchant';
export { guessCategory, classifySmsCategory, DEFAULT_CATEGORY_RULES } from './category';
export type { SmsCategory, CategoryRule } from './category';
export { extractDate } from './date';

// Duplicate detection
export { filterDuplicates, computeFingerprint, extractReference, logDuplicates } from './dedupe';
export type { DedupeResult, DuplicateSkip, KnownImported } from './dedupe';

// Native reader
export { isSmsReadingAvailable, requestSmsPermission, readInbox } from './smsReader';
