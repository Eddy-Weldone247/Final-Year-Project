import type { Category } from '@/types/transaction';

import type { SmsProvider } from './types';

/**
 * Currency amounts. Ghanaian financial SMS write amounts as "GHS 50.00",
 * "GH¢50", "GHC1,200.50", "₵20" — and occasionally suffixed ("50.00 GHS").
 */
export const AMOUNT_PREFIX_RE = /(?:GHS|GH₵|GH¢|GHC|₵)\s*([\d,]+(?:\.\d{1,2})?)/gi;
export const AMOUNT_SUFFIX_RE = /([\d,]+(?:\.\d{1,2})?)\s*(?:GHS|GH₵|GH¢|GHC|₵|cedis)/gi;

/** Words that mean money came IN (income). */
export const CREDIT_RE =
  /\b(receiv(?:e|ed)|credit(?:ed)?|deposit(?:ed)?|refund(?:ed)?|reversal|reversed|cash\s*in|salary)\b/i;

/** Words that mean money went OUT (expense). */
export const DEBIT_RE =
  /\b(sent|debit(?:ed)?|payment|paid|purchase[d]?|withdraw(?:n|al)?|transfer(?:red)?|spent|airtime|bundle|bill|cash\s*out|charged?)\b/i;

/** If any of these precede an amount, it's a fee/balance — not the main amount. */
export const FEE_CONTEXT_RE = /(fee|charge|charged|e-?levy|levy|balance|bal|tax)/i;

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

/** Keyword → category mapping for guessing a transaction's category. */
export const CATEGORY_KEYWORDS: { category: Category; re: RegExp }[] = [
  {
    category: 'FOOD',
    re: /\b(restaurant|kfc|pizza|chop\s*bar|food|cafe|eatery|papaye|kingsbite|burger|chicken)\b/i,
  },
  {
    category: 'TRANSPORT',
    re: /\b(uber|bolt|yango|fuel|shell|goil|total|petrol|trotro|taxi|vvip|stc|transport|fare)\b/i,
  },
  {
    category: 'SHOPPING',
    re: /\b(melcom|shoprite|mall|game|jumia|shop|store|boutique|supermarket|palace|market)\b/i,
  },
  {
    category: 'UTILITIES',
    re: /\b(ecg|electricity|prepaid|water|gwcl|dstv|gotv|startimes|airtime|data|bundle|surfline|telecom|internet|bill)\b/i,
  },
  { category: 'HEALTHCARE', re: /\b(pharmacy|hospital|clinic|medical|drug|chemist|lab)\b/i },
  {
    category: 'EDUCATION',
    re: /\b(school|university|college|tuition|wassce|knust|legon|ucc|academy|fees)\b/i,
  },
  {
    category: 'ENTERTAINMENT',
    re: /\b(cinema|silverbird|netflix|spotify|showmax|betway|sportybet|game|event|club)\b/i,
  },
];
