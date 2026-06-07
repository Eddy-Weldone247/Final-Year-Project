import type { AuthPalette } from '@/theme/authTheme';
import type { BudgetStatus } from '@/types/budget';

/** Amber for the warning state (auth palette has no warning token). */
const AMBER = '#F59E0B';

/** Budget status → themed colour (ok green, warning amber, exceeded red). */
export function budgetStatusColor(status: BudgetStatus, c: AuthPalette): string {
  if (status === 'exceeded') return c.danger;
  if (status === 'warning') return AMBER;
  return c.success;
}

export function budgetStatusLabel(status: BudgetStatus): string {
  if (status === 'exceeded') return 'Over budget';
  if (status === 'warning') return 'Almost there';
  return 'On track';
}
