const ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "YYYY-MM" → "Jun". */
export function shortMonth(ym: string): string {
  const m = Number(ym.slice(5, 7)) - 1;
  return ABBR[m] ?? '';
}

/** Rounds up to a clean axis maximum (e.g. 1240 → 2000). */
export function niceMax(value: number): number {
  if (value <= 0) return 100;
  const pow = Math.pow(10, Math.floor(Math.log10(value)));
  return Math.ceil(value / pow) * pow;
}
