import type { TransactionType } from '@/types/transaction';

import { MERCHANT_STOP_RE } from './patterns';

/**
 * SMS merchant / counterparty extraction layer.
 *
 * Pulls the short NAME the money moved to or from — a merchant, receiver,
 * sender, or institution — never a whole sentence and never an account / phone
 * number. When no name can be identified it returns the sentinel `UNKNOWN_MERCHANT`
 * ("Unknown") rather than dumping raw SMS text.
 *
 * Two complementary strategies (reusable in isolation):
 *   1. `matchKnownEntity` — a curated dictionary of Ghanaian financial
 *      institutions and common merchants (MTN MoMo, Ecobank, Bolt, Melcom, KFC,
 *      Shell, Goil…) that returns a canonical, well-cased name.
 *   2. `extractCounterparty` — strict name-token capture after the money-flow
 *      prepositions ("to"/"at" for out, "from" for in), stopping at connective
 *      words, punctuation, or numbers so only the name survives.
 */

/** Returned when no merchant/counterparty can be identified. */
export const UNKNOWN_MERCHANT = 'Unknown';

interface KnownEntity {
  /** Canonical display name. */
  name: string;
  /** Matcher against SMS text (word-boundaried where safe). */
  re: RegExp;
}

/**
 * Curated, reusable dictionary of institutions and merchants. Ordered specific →
 * generic so multi-word names win. Extend freely — this is the single source of
 * truth for canonical merchant names.
 */
export const KNOWN_ENTITIES: KnownEntity[] = [
  // --- Mobile money / telco wallets ---
  { name: 'MTN MoMo', re: /\bMTN(?:\s*(?:MoMo|Mobile\s*Money))?\b/i },
  { name: 'Telecel Cash', re: /\b(?:Telecel(?:\s*Cash)?|Vodafone(?:\s*Cash)?|Voda\s*Cash)\b/i },
  {
    name: 'AirtelTigo Money',
    re: /\b(?:AirtelTigo|Airtel\s*Tigo|AT\s*Money|Tigo\s*Cash|Airtel\s*Money)\b/i,
  },
  // --- Banks ---
  { name: 'Ecobank', re: /\bEcobank\b/i },
  { name: 'Absa', re: /\bAbsa\b/i },
  { name: 'Stanbic', re: /\bStanbic\b/i },
  { name: 'Standard Chartered', re: /\bStandard\s*Chartered\b/i },
  { name: 'GCB Bank', re: /\bGCB(?:\s*Bank)?\b/i },
  { name: 'CalBank', re: /\bCal\s*Bank\b/i },
  { name: 'Fidelity Bank', re: /\bFidelity(?:\s*Bank)?\b/i },
  { name: 'Zenith Bank', re: /\bZenith(?:\s*Bank)?\b/i },
  { name: 'Access Bank', re: /\bAccess\s*Bank\b/i },
  { name: 'GTBank', re: /\bGT\s*Bank\b|\bGTBank\b/i },
  { name: 'ADB', re: /\bADB(?:\s*Bank)?\b|\bAgricultural\s*Development\s*Bank\b/i },
  { name: 'Republic Bank', re: /\bRepublic\s*Bank\b/i },
  { name: 'UBA', re: /\bUBA\b/i },
  { name: 'Prudential Bank', re: /\bPrudential(?:\s*Bank)?\b/i },
  { name: 'First Atlantic Bank', re: /\bFirst\s*Atlantic\b/i },
  { name: 'OmniBSIC', re: /\bOmni\s*BSIC\b|\bOmniBSIC\b/i },
  // --- Transport ---
  { name: 'Bolt', re: /\bBolt\b/i },
  { name: 'Uber', re: /\bUber\b/i },
  { name: 'Yango', re: /\bYango\b/i },
  // --- Fuel ---
  { name: 'Shell', re: /\bShell\b/i },
  { name: 'Goil', re: /\bGoil\b/i },
  { name: 'TotalEnergies', re: /\bTotal(?:Energies)?\b/i },
  { name: 'Star Oil', re: /\bStar\s*Oil\b/i },
  { name: 'Puma', re: /\bPuma(?:\s*Energy)?\b/i },
  // --- Retail / shopping ---
  { name: 'Melcom', re: /\bMelcom\b/i },
  { name: 'Shoprite', re: /\bShoprite\b/i },
  { name: 'Palace', re: /\bPalace\b/i },
  { name: 'Game', re: /\bGame\s*Store\b|\bGame\b/i },
  { name: 'Jumia', re: /\bJumia\b/i },
  // --- Food ---
  { name: 'KFC', re: /\bKFC\b/i },
  { name: 'Papaye', re: /\bPapaye\b/i },
  { name: 'Pizza Hut', re: /\bPizza\s*Hut\b/i },
  { name: 'Burger King', re: /\bBurger\s*King\b/i },
  { name: 'Kingsbite', re: /\bKingsbite\b/i },
  // --- Utilities / TV ---
  { name: 'ECG', re: /\bECG\b|\bElectricity\s*Company\b/i },
  { name: 'GWCL', re: /\bGWCL\b|\bGhana\s*Water\b/i },
  { name: 'DSTV', re: /\bDSTV\b/i },
  { name: 'GOtv', re: /\bGOtv\b/i },
  { name: 'StarTimes', re: /\bStarTimes\b/i },
  // --- Entertainment ---
  { name: 'Netflix', re: /\bNetflix\b/i },
  { name: 'Spotify', re: /\bSpotify\b/i },
  { name: 'Showmax', re: /\bShowmax\b/i },
  { name: 'Betway', re: /\bBetway\b/i },
  { name: 'SportyBet', re: /\bSportyBet\b/i },
];

/**
 * Connective / sentence words that must never be treated as (or included in) a
 * merchant name. Complements the shared `MERCHANT_STOP_RE`.
 */
const CONNECTOR_STOP_RE =
  /^(?:from|to|at|via|using|and|the|a|an|your|you|for|of|by|on|in|is|was|were|has|have|had|been|new|current|available|avail|ref|txn|trans|transaction|id|bal|balance|success(?:ful)?|wallet|account|acct|mobile|money|cash|momo|fee|fees|charge|charges|dear|hi|hello|mr|mrs|ms|dr)$/i;

/** A pure account / phone / reference number (never a name). */
const NUMERIC_TOKEN_RE = /^[#*]?\d[\d*#/-]*$/;

/** Characters allowed inside a single name token. */
const NAME_TOKEN_RE = /^[A-Za-z0-9][A-Za-z0-9&.'/-]*$/;

/** Max tokens a captured name may contain (real names rarely exceed this). */
const MAX_NAME_TOKENS = 4;

/**
 * Returns the canonical name of the first known entity found in `text`, or
 * `null`. Reusable for both a short captured phrase and a whole SMS body.
 */
export function matchKnownEntity(text: string): string | null {
  for (const entity of KNOWN_ENTITIES) {
    if (entity.re.test(text)) return entity.name;
  }
  return null;
}

/**
 * Trims a raw captured phrase down to just the leading name tokens: stops at the
 * first punctuation, connective/stop word, or numeric token. Returns `''` when
 * nothing name-like remains.
 */
export function cleanMerchantName(raw: string): string {
  // Cut at the first sentence delimiter so trailing clauses are dropped.
  const clause = raw.split(/[.,;:()\n!?]/)[0] ?? raw;
  const tokens = clause.trim().split(/\s+/);
  const kept: string[] = [];

  for (const token of tokens) {
    // Strip surrounding punctuation the token may have picked up.
    const t = token.replace(/^[^A-Za-z0-9]+/, '').replace(/[^A-Za-z0-9&.'/-]+$/, '');
    if (!t) break;
    if (NUMERIC_TOKEN_RE.test(t)) break; // account / phone / reference number
    if (CONNECTOR_STOP_RE.test(t) || MERCHANT_STOP_RE.test(t)) break;
    if (!NAME_TOKEN_RE.test(t)) break;
    // A lowercase-initial token is a sentence word unless it's a known brand.
    if (/^[a-z]/.test(t) && !matchKnownEntity(t)) break;
    kept.push(t);
    if (kept.length >= MAX_NAME_TOKENS) break;
  }

  return kept.join(' ').trim();
}

/**
 * Captures the counterparty after the money-flow prepositions: "from" for income
 * (sender), "to"/"at"/"from" for expenses (receiver/merchant). Returns the first
 * valid name found, or `null`.
 */
export function extractCounterparty(body: string, type: TransactionType): string | null {
  const keywords = type === 'INCOME' ? ['from'] : ['to', 'at', 'from'];
  for (const keyword of keywords) {
    // Capture a bounded chunk after the keyword; cleaning does the trimming.
    const re = new RegExp(`\\b${keyword}\\s+([A-Za-z0-9#*][^\\n]{0,40})`, 'i');
    const match = body.match(re);
    if (!match?.[1]) continue;
    const name = cleanMerchantName(match[1]);
    if (name.length >= 2) return name;
  }
  return null;
}

/**
 * Extracts the merchant / receiver / sender / institution as a short name, or
 * {@link UNKNOWN_MERCHANT} when none can be identified.
 *
 * Preference order: the actual counterparty from the sentence (normalised to a
 * canonical name if it's a known entity) → any known entity mentioned anywhere
 * in the body → "Unknown".
 */
export function extractMerchant(body: string, type: TransactionType): string {
  const counterparty = extractCounterparty(body, type);
  if (counterparty) {
    return matchKnownEntity(counterparty) ?? counterparty;
  }
  return matchKnownEntity(body) ?? UNKNOWN_MERCHANT;
}
