import type { Category } from '@/types/transaction';

/**
 * SMS transaction category classification layer.
 *
 * Classifies a transaction SMS into a predefined category by keyword mapping —
 * never by echoing raw SMS text. Two levels:
 *   • `SmsCategory` — a rich, human-facing label set (Food, Transport, Salary,
 *     Airtime, Internet, Cash Withdrawal, Investments, …). This is what the
 *     keyword rules classify into, and it is fully configurable.
 *   • `Category` — the app's fixed domain enum actually stored on a transaction
 *     (FOOD…OTHERS). Each `SmsCategory` maps onto it via `SMS_CATEGORY_TO_DOMAIN`.
 *
 * Classification is a first-match scan over an ORDERED rule list, so specific
 * rules (e.g. Internet "data bundle", Cash Withdrawal "ATM") are placed before
 * generic ones. Anything unmatched becomes `Miscellaneous` → `OTHERS`.
 *
 * To customise, pass your own ordered `CategoryRule[]` to `classifySmsCategory`
 * / `guessCategory`, or extend `DEFAULT_CATEGORY_RULES`.
 */

/** Rich, human-facing categories a transaction SMS can be classified into. */
export type SmsCategory =
  | 'Food'
  | 'Transport'
  | 'Shopping'
  | 'Utilities'
  | 'Entertainment'
  | 'Healthcare'
  | 'Education'
  | 'Salary'
  | 'Income'
  | 'Transfer'
  | 'Bills'
  | 'Airtime'
  | 'Internet'
  | 'Mobile Money'
  | 'Cash Withdrawal'
  | 'Cash Deposit'
  | 'Insurance'
  | 'Investments'
  | 'Miscellaneous';

/** Fallback category when nothing matches. */
export const FALLBACK_CATEGORY: SmsCategory = 'Miscellaneous';

/** A single keyword→category rule. */
export interface CategoryRule {
  category: SmsCategory;
  /** Keyword matcher (case-insensitive, word-boundaried where safe). */
  re: RegExp;
}

/**
 * Default, ORDERED keyword rules. Order matters — the first match wins, so more
 * specific categories are listed before broader ones. Override or extend this
 * to configure classification.
 */
export const DEFAULT_CATEGORY_RULES: CategoryRule[] = [
  // --- Income (Salary before cash-deposit so "salary deposited" → Salary) ---
  { category: 'Salary', re: /\b(salary|payroll|wages?|sal(?:ary)?\s*credit|stipend|allowance)\b/i },
  // --- Cash movement (before Mobile Money so "MoMo cash out" → withdrawal) ---
  { category: 'Cash Withdrawal', re: /\b(atm|cash\s*out|cashout|withdraw(?:al|n|s)?)\b/i },
  {
    category: 'Cash Deposit',
    re: /\b(cash\s*in|cashin|cash\s*deposit|deposit(?:ed)?|over[-\s]?the[-\s]?counter)\b/i,
  },
  // --- Financial services (before Bills so "treasury bill" → Investments) ---
  {
    category: 'Insurance',
    re: /\b(insurance|assurance|\bpolicy\b|premium|glico|\bsic\b|star\s*assurance|hollard|enterprise\s*insurance)\b/i,
  },
  {
    category: 'Investments',
    re: /\b(investment|\binvest\b|mutual\s*fund|treasury|t-?bill|\bbonds?\b|stocks?|shares?|databank|portfolio|\bsusu\b)\b/i,
  },
  // --- Telco: Internet before Airtime so "data bundle" wins over "recharge" ---
  {
    category: 'Internet',
    re: /\b(internet|broadband|fibre|fiber|wi-?fi|mifi|data\s*bundle|\bdata\b|surfline|busy\s*4g|telecel\s*data|mtn\s*data|vodafone(?!\s*cash))\b/i,
  },
  {
    category: 'Airtime',
    re: /\b(airtime|air\s*time|top[-\s]?up|topup|recharg(?:e|ed|es|ing)|voice\s*bundle|credit\s*units?|units?\s*purchase)\b/i,
  },
  // --- Wallet ---
  {
    category: 'Mobile Money',
    re: /\b(mobile\s*money|momo|(?:vodafone|telecel|airtel\s*tigo|airteltigo|at)\s*cash|voda\s*cash|e-?wallet|\bwallet\b)\b/i,
  },
  // --- Streaming/entertainment before Bills so "Netflix subscription" → Entertainment ---
  {
    category: 'Entertainment',
    re: /\b(cinema|silverbird|netflix|spotify|showmax|betway|sportybet|\bbet\b|event|\bclub\b|concert|gaming|movie)\b/i,
  },
  // --- Bills & utilities (Bills before Utilities for TV/pay-TV/rent) ---
  {
    category: 'Bills',
    re: /\b(dstv|gotv|startimes|tv\s*subscription|utility\s*bill|\bbills?\b|\brent\b|postpaid)\b/i,
  },
  {
    category: 'Utilities',
    re: /\b(ecg|electricity|prepaid|\bpower\b|\bwater\b|gwcl|ghana\s*water|utility|gas\s*bill)\b/i,
  },
  // --- Spending merchants ---
  {
    category: 'Transport',
    re: /\b(uber|bolt|yango|trotro|tro-?tro|taxi|\bfare\b|shell|goil|total(?:energies)?|star\s*oil|puma|petrol|fuel|diesel|transport|vvip|\bstc\b|metro\s*mass)\b/i,
  },
  {
    category: 'Food',
    re: /\b(restaurant|kfc|pizza|chop\s*bar|\bfood\b|cafe|café|eatery|papaye|kingsbite|burger|chicken|barbeque|bbq|grill|kitchen|snack)\b/i,
  },
  {
    category: 'Shopping',
    re: /\b(melcom|shoprite|\bmall\b|game\s*store|jumia|\bshop\b|\bstore\b|boutique|supermarket|palace|\bmarket\b|clothing|electronics)\b/i,
  },
  {
    category: 'Healthcare',
    re: /\b(pharmacy|hospital|clinic|medical|\bdrug\b|chemist|\blab\b|health|dental|optic)\b/i,
  },
  {
    category: 'Education',
    re: /\b(school|university|college|tuition|wassce|knust|legon|\bucc\b|academy|\bfees\b|exam|course|tutorial)\b/i,
  },
  // --- Generic money-movement (low priority so specific merchants win first) ---
  {
    category: 'Transfer',
    re: /\b(transfer(?:red)?|remittance|money\s*transfer|funds?\s*transfer|sent\s*to|received\s*from)\b/i,
  },
  { category: 'Income', re: /\b(income|earnings?|refund(?:ed)?|reversal|payout)\b/i },
];

/**
 * Maps each rich {@link SmsCategory} to the app's stored domain {@link Category}
 * enum. The domain enum is intentionally coarse (8 values), so several rich
 * categories collapse onto `OTHERS`.
 */
export const SMS_CATEGORY_TO_DOMAIN: Record<SmsCategory, Category> = {
  Food: 'FOOD',
  Transport: 'TRANSPORT',
  Shopping: 'SHOPPING',
  Entertainment: 'ENTERTAINMENT',
  Healthcare: 'HEALTHCARE',
  Education: 'EDUCATION',
  Utilities: 'UTILITIES',
  Bills: 'UTILITIES',
  Airtime: 'UTILITIES',
  Internet: 'UTILITIES',
  Salary: 'OTHERS',
  Income: 'OTHERS',
  Transfer: 'OTHERS',
  'Mobile Money': 'OTHERS',
  'Cash Withdrawal': 'OTHERS',
  'Cash Deposit': 'OTHERS',
  Insurance: 'OTHERS',
  Investments: 'OTHERS',
  Miscellaneous: 'OTHERS',
};

/**
 * Classifies text (merchant + SMS body) into a rich {@link SmsCategory}.
 * Returns {@link FALLBACK_CATEGORY} ("Miscellaneous") when nothing matches.
 *
 * @param text The text to classify (e.g. `"<merchant> <body>"`).
 * @param rules Ordered rules to use (defaults to {@link DEFAULT_CATEGORY_RULES}).
 */
export function classifySmsCategory(
  text: string,
  rules: CategoryRule[] = DEFAULT_CATEGORY_RULES,
): SmsCategory {
  for (const { category, re } of rules) {
    if (re.test(text)) return category;
  }
  return FALLBACK_CATEGORY;
}

/**
 * Classifies a transaction into the app's stored domain {@link Category}, using
 * keyword rules over the merchant + body. Defaults to `OTHERS` (Miscellaneous).
 * Signature-compatible with the parser's previous `guessCategory`.
 *
 * @param body The SMS body.
 * @param merchant The extracted merchant/counterparty (may be null/"Unknown").
 * @param rules Optional custom rules for configurable classification.
 */
export function guessCategory(
  body: string,
  merchant: string | null,
  rules: CategoryRule[] = DEFAULT_CATEGORY_RULES,
): Category {
  const haystack = `${merchant ?? ''} ${body}`;
  return SMS_CATEGORY_TO_DOMAIN[classifySmsCategory(haystack, rules)];
}
