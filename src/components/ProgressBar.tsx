import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import type { ThemeColors } from '@/theme/palette';
import type { BudgetStatus } from '@/types/budget';

/** Budget status → themed colour (ok green, warning amber, exceeded red). */
export function statusColor(status: BudgetStatus, colors: ThemeColors): string {
  if (status === 'exceeded') return colors.expense;
  if (status === 'warning') return colors.warning;
  return colors.income;
}

interface ProgressBarProps {
  percent: number;
  status: BudgetStatus;
}

export function ProgressBar({ percent, status }: ProgressBarProps) {
  const { colors } = useTheme();
  const width = Math.max(0, Math.min(percent, 100));
  return (
    <View style={[styles.track, { backgroundColor: colors.cardAlt }]}>
      <View
        style={[styles.fill, { width: `${width}%`, backgroundColor: statusColor(status, colors) }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    borderRadius: 6,
    height: 10,
    overflow: 'hidden',
    width: '100%',
  },
  fill: { height: '100%' },
});
