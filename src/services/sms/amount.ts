import type { SmsProvider } from './types';

/**
 * SMS transaction-amount extraction layer.
 *
 * Given a transaction SMS body, pull out the ONE number that is the real
 * transaction amount — never a phone number, OTP, reference / account / txn ID,
 * running balance, fee, levy, tax or reward points.
 *
 * How accuracy is achieved:
 *   1. A number only qualifies if it is **adjacent to a currency marker**
 *      (GH₵ / GHS / GHC / ₵ / cedis / USD / US$ / $). This alone discards phone
 *      numbers, OTPs, reference/account/transaction IDs and reward points, which
 *      are never currency-tagged.
 *   2. When several currency amounts exist, each candidate is scored by the words
 *      immediately BEFORE and AFTER it: transaction verbs (received/sent/paid/
 *      debited…) promote it; balance/fee/levy/tax/reward context demotes it. The
 *      best-scoring candidate wins.
 *   3. A transparent `confidence` (0..1) reflects how sure the pick is.
 *
 * This module is standalone and side-effect free — it owns its own regexes
 * (local, non-global for `.test()`, fresh instances per scan for `.exec()`), so
 * it can be unit-tested in isolation and reused anywhere.
 */

/** Currencies recognised in transaction SMS. */
export type CurrencyCode = 'GHS' | 'USD';

/** The extracted transaction amount, its currency, and pick confidence. */
export interface ExtractedAmount {
  /** The numeric transaction amount (thousands separators removed). */
  amount: number;
  /** ISO-ish currency code inferred from the adjacent marker. */
  currency: CurrencyCode;
  /** How confident we are this is the real transaction amount (0..1). */
  confidence: number;
}

/**
 * A currency-tagged amount. Two shapes are matched:
 *   • prefix  — marker before the number:  "GH₵250.00", "GHS 120", "USD 25"
 *   • suffix  — marker after the number:   "50.00 GHS", "25 dollars", "120 cedis"
 *
 * The number allows optional thousands separators and up to two decimals. Both
 * regexes are built fresh per scan (the `g` flag carries `lastIndex` state).
 */
function prefixRe(): RegExp {
  // Longer / more specific markers first so e.g. "GH₵" wins over bare "₵".
  return /(GH₵|GH¢|GHC|GHS|₵|US\$|USD|\$)\s*(\d[\d,]*(?:\.\d{1,2})?)\b/gi;
}
function suffixRe(): RegExp {
  return /\b(\d[\d,]*(?:\.\d{1,2})?)\s*(GH₵|GH¢|GHC|GHS|₵|cedis|USD|dollars)\b/gi;
}

/**
 * Whether `text` contains at least one currency-tagged amount. The single source
 * of truth for "does this look like money" — reused by the validator so its
 * financial-signal check can never disagree with what the extractor recognises.
 */
export function hasCurrencyAmount(text: string): boolean {
  return prefixRe().test(text) || suffixRe().test(text);
}

/**
 * Context that marks a nearby amount as NOT the transaction amount: a running
 * balance, a fee / levy / tax / commission, a reward-points total, a limit, or a
 * previous/opening/closing figure. Deliberately excludes the verb "charged"
 * (as in "card was charged GH₵150"), which is a genuine purchase.
 */
const EXCLUDE_CONTEXT_RE =
  /(bal(?:ance)?|avail(?:able)?|ledger|e-?levy|\blevy\b|\btax\b|\bvat\b|\bfee(?:s)?\b|service\s*charge|\bcharges\b|commission|\breward(?:s)?\b|\bpoints?\b|\blimit\b|remaining|previous|opening|closing)/i;

/**
 * Context that marks a nearby amount AS the transaction amount: a money-movement
 * verb or an explicit "amount/value/of/for" lead-in.
 */
const POSITIVE_CONTEXT_RE =
  /(receiv(?:e|ed)|sent|send|paid|payment|\bpay\b|debit(?:ed)?|credit(?:ed)?|withdr(?:aw|ew|awn|awal)?|deposit(?:ed)?|transfer(?:red)?|purchase[d]?|spent|spend|cash\s*(?:in|out)|\bamount\b|\bvalue\b|charged|\bof\b|\bfor\b)/i;

/** How many characters on each side of an amount form its context window. */
const CONTEXT_WINDOW = 28;

/**
 * Clause boundaries. Context is trimmed to the amount's OWN clause so a keyword
 * from a neighbouring sentence (e.g. a trailing "…Charges: ₵0.75") can't leak
 * into this amount's context. Note: `:` is intentionally NOT a delimiter — it
 * joins label→value ("Balance: GH₵300"), which we must keep together.
 */
const CLAUSE_DELIM_RE = /[.,;!?\n]/;

/** Text after the last clause boundary within a preceding window. */
function lastClause(s: string): string {
  const parts = s.split(CLAUSE_DELIM_RE);
  return parts[parts.length - 1] ?? s;
}

/** Text before the first clause boundary within a following window. */
function firstClause(s: string): string {
  return s.split(CLAUSE_DELIM_RE)[0] ?? s;
}

interface Candidate {
  value: number;
  currency: CurrencyCode;
  index: number;
  excluded: boolean;
  positive: boolean;
}

/** Maps a matched currency marker to its normalised code. */
function normalizeCurrency(marker: string): CurrencyCode {
  const m = marker.toUpperCase();
  if (m.includes('US') || m === '$' || m.startsWith('DOLLAR')) return 'USD';
  return 'GHS'; // GHS, GH₵, GH¢, GHC, ₵, cedis
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

/** Collects every currency-tagged amount in the body with its local context. */
function collectCandidates(body: string): Candidate[] {
  const out: Candidate[] = [];
  const seen = new Set<number>(); // dedupe prefix/suffix hits at the same spot

  for (const [re, markerGroup, numGroup] of [
    [prefixRe(), 1, 2] as const,
    [suffixRe(), 2, 1] as const,
  ]) {
    let match: RegExpExecArray | null;
    while ((match = re.exec(body)) !== null) {
      const marker = match[markerGroup];
      const raw = match[numGroup];
      if (!marker || !raw) continue;
      if (seen.has(match.index)) continue;
      seen.add(match.index);

      const value = parseFloat(raw.replace(/,/g, ''));
      if (!Number.isFinite(value)) continue;

      const endIndex = match.index + match[0].length;
      // Trim each side to the amount's own clause so neighbouring sentences
      // ("…Bal GH₵9.25.") can't contribute their keywords to this amount.
      const pre = lastClause(body.slice(Math.max(0, match.index - CONTEXT_WINDOW), match.index));
      const post = firstClause(body.slice(endIndex, endIndex + CONTEXT_WINDOW));
      out.push({
        value,
        currency: normalizeCurrency(marker),
        index: match.index,
        excluded: EXCLUDE_CONTEXT_RE.test(pre) || EXCLUDE_CONTEXT_RE.test(post),
        positive: POSITIVE_CONTEXT_RE.test(pre) || POSITIVE_CONTEXT_RE.test(post),
      });
    }
  }

  return out.sort((a, b) => a.index - b.index);
}

/**
 * Extracts the real transaction amount from an SMS body.
 *
 * @param body The SMS text.
 * @param _provider Reserved for provider-specific tuning (unused for now).
 * @returns `{ amount, currency, confidence }` or `null` when no currency-tagged
 *   amount is present.
 */
export function extractAmount(
  body: string,
  _provider?: SmsProvider | null,
): ExtractedAmount | null {
  const candidates = collectCandidates(body);
  if (candidates.length === 0) return null;

  // Prefer amounts that are NOT a balance/fee/reward; fall back to all if every
  // candidate looks excluded (over-eager exclusion shouldn't lose a real amount).
  const preferred = candidates.filter((c) => !c.excluded);
  const pool = preferred.length > 0 ? preferred : candidates;

  // Within the pool, a candidate with a transaction verb beside it wins; ties
  // break to the earliest mention (the amount is usually stated before balance).
  const positives = pool.filter((c) => c.positive);
  const chosen = (positives.length > 0 ? positives : pool)[0] as Candidate;

  // --- Confidence ---
  let confidence = 0.5;
  if (chosen.positive) confidence += 0.35;
  if (!chosen.excluded) confidence += 0.05;
  else confidence -= 0.2; // had to fall back to a balance/fee amount
  if (candidates.length === 1) confidence += 0.1;
  // Multiple viable amounts but none with clear transaction context → ambiguous.
  if (preferred.length > 1 && !chosen.positive) confidence -= 0.1;

  return {
    amount: chosen.value,
    currency: chosen.currency,
    confidence: Math.round(clamp01(confidence) * 100) / 100,
  };
}
