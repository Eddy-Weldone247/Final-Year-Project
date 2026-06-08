import { BlurView } from 'expo-blur';
import { type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/animations/PressableScale';
import { MinusIcon, PlusIcon, TargetIcon } from '@/components/icons';
import { useAuthTheme } from '@/theme/authTheme';
import { fontFamily } from '@/theme/typography';

interface QuickActionsProps {
  onAddExpense: () => void;
  onAddIncome: () => void;
  onSetBudget: () => void;
}

function Action({
  label,
  color,
  icon,
  onPress,
}: {
  label: string;
  color: string;
  icon: ReactNode;
  onPress: () => void;
}) {
  const { c } = useAuthTheme();
  return (
    <PressableScale
      onPress={onPress}
      style={styles.action}
      accessibilityLabel={label}
      scaleTo={0.93}
    >
      <BlurView
        intensity={c.blurIntensity}
        tint={c.blurTint}
        experimentalBlurMethod="dimezisBlurView"
        style={styles.clip}
      >
        <View style={[styles.tile, { backgroundColor: c.glassBg, borderColor: c.glassBorder }]}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: `${color}26`, borderColor: `${color}55` },
            ]}
          >
            {icon}
          </View>
          <Text style={[styles.label, { color: c.text }]}>{label}</Text>
        </View>
      </BlurView>
    </PressableScale>
  );
}

/** Glass quick-action tiles: Add Expense · Add Income · Set Budget. */
export function QuickActions({ onAddExpense, onAddIncome, onSetBudget }: QuickActionsProps) {
  const { c } = useAuthTheme();
  return (
    <View style={styles.row}>
      <Action
        label="Add Expense"
        color={c.danger}
        icon={<MinusIcon size={22} color={c.danger} />}
        onPress={onAddExpense}
      />
      <Action
        label="Add Income"
        color={c.success}
        icon={<PlusIcon size={22} color={c.success} />}
        onPress={onAddIncome}
      />
      <Action
        label="Set Budget"
        color={c.primary}
        icon={<TargetIcon size={22} color={c.primary} />}
        onPress={onSetBudget}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12 },
  action: { flex: 1 },
  clip: { borderRadius: 20, overflow: 'hidden' },
  tile: {
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: 13, fontFamily: fontFamily.semibold, textAlign: 'center' },
});
