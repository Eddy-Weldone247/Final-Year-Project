/**
 * SMS date extraction.
 *
 * Finds an explicit transaction date in the message body (dd-MMM-yyyy,
 * yyyy-mm-dd, or dd-mm-yyyy / dd/mm/yyyy), falling back to the SMS received time
 * when none is present. Returns an ISO date string.
 */

const MONTHS: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

/** Expands a 2-digit year to 4 digits (`26` → `2026`). */
function fullYear(raw: string): number {
  const n = Number(raw);
  return raw.length <= 2 ? 2000 + n : n;
}

/** Builds a UTC ISO date string from y/m/d parts. */
function isoDate(year: number, monthIndex: number, day: number): string {
  return new Date(Date.UTC(year, monthIndex, day)).toISOString();
}

/** Finds an explicit date in the body, falling back to the received time. */
export function extractDate(body: string, fallbackMs: number): string {
  // dd-MMM-yyyy / dd MMM yyyy (e.g. 01-Jun-2026)
  let m = body.match(/\b(\d{1,2})[-/ ]([A-Za-z]{3,9})[-/ ](\d{2,4})\b/);
  if (m && m[1] && m[2] && m[3]) {
    const month = MONTHS[m[2].slice(0, 3).toLowerCase()];
    if (month !== undefined) return isoDate(fullYear(m[3]), month, Number(m[1]));
  }
  // yyyy-mm-dd
  m = body.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (m && m[1] && m[2] && m[3]) return isoDate(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  // dd-mm-yyyy / dd/mm/yyyy
  m = body.match(/\b(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})\b/);
  if (m && m[1] && m[2] && m[3]) return isoDate(fullYear(m[3]), Number(m[2]) - 1, Number(m[1]));
  return new Date(fallbackMs).toISOString();
}
