/** Formats a number as a USD-style currency string (engine-agnostic, no Intl). */
export function formatCurrency(value: number): string {
  const negative = value < 0;
  const [intPart, decPart] = Math.abs(value).toFixed(2).split('.');
  const withThousands = (intPart ?? '0').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${negative ? '-' : ''}$${withThousands}.${decPart}`;
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
