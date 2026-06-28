/**
 * App currency — Ghanaian Cedi. Single source of truth so every screen stays in
 * sync. `CURRENCY_SYMBOL` is the display symbol; `CURRENCY_GLYPH` is the bare
 * cedi sign for tight spots (e.g. a coin illustration).
 */
export const CURRENCY_CODE = 'GHS';
export const CURRENCY_SYMBOL = 'GH₵';
export const CURRENCY_GLYPH = '₵';
export const CURRENCY_LOCALE = 'en-GH';

/**
 * Formats a number as a GH₵ currency string, e.g. `GH₵1,234.56`.
 *
 * Implemented manually (NO `Intl`): the Hermes engine ships without full ICU
 * locale data, so `Intl.NumberFormat({ style: 'currency' })` is unreliable
 * on-device. This stays engine-agnostic and consistent everywhere.
 */
export function formatCurrency(value: number): string {
  const negative = value < 0;
  const [intPart, decPart] = Math.abs(value).toFixed(2).split('.');
  const withThousands = (intPart ?? '0').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${negative ? '-' : ''}${CURRENCY_SYMBOL}${withThousands}.${decPart}`;
}

/** Formats an ISO date string as e.g. "Jun 1, 2026". */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}
