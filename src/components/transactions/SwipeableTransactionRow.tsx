import { type ReactNode, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, {
  Extrapolation,
  FadeInDown,
  interpolate,
  LinearTransition,
  type SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';

import { PressableScale } from '@/components/animations/PressableScale';
import { PencilIcon, TrashIcon } from '@/components/icons';
import { getCategoryMeta } from '@/constants/categories';
import { useAuthTheme } from '@/theme/authTheme';
import { fontFamily } from '@/theme/typography';
import type { Transaction } from '@/types/transaction';
import { formatCurrency, formatDate } from '@/utils/formatCurrency';

function SwipeAction({
  progress,
  side,
  color,
  label,
  icon,
  onPress,
}: {
  progress: SharedValue<number>;
  side: 'left' | 'right';
  color: string;
  label: string;
  icon: ReactNode;
  onPress: () => void;
}) {
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0.2, 1], Extrapolation.CLAMP),
    transform: [{ scale: interpolate(progress.value, [0, 1], [0.6, 1], Extrapolation.CLAMP) }],
  }));
  return (
    <View style={[styles.actionWrap, side === 'left' ? styles.actionLeft : styles.actionRight]}>
      <PressableScale onPress={onPress} scaleTo={0.9} accessibilityLabel={label}>
        <Animated.View style={[styles.action, { backgroundColor: color }, style]}>
          {icon}
          <Text style={styles.actionLabel}>{label}</Text>
        </Animated.View>
      </PressableScale>
    </View>
  );
}

interface Props {
  transaction: Transaction;
  index: number;
  onEdit: (t: Transaction) => void;
  onDelete: (t: Transaction) => void;
}

/**
 * A glass transaction card. Tap = edit (consistent with the dashboard's recent
 * list); swipe right = Edit, swipe left = Delete.
 */
export function SwipeableTransactionRow({ transaction, index, onEdit, onDelete }: Props) {
  const { c } = useAuthTheme();
  const ref = useRef<SwipeableMethods>(null);

  const meta = getCategoryMeta(transaction.category);
  const isIncome = transaction.type === 'INCOME';

  const handleEdit = () => {
    ref.current?.close();
    onEdit(transaction);
  };
  const handleDelete = () => {
    ref.current?.close();
    onDelete(transaction);
  };

  return (
    <Animated.View
      entering={FadeInDown.duration(360).delay(Math.min(index, 8) * 45)}
      layout={LinearTransition.springify().damping(18)}
      style={styles.outer}
    >
      <ReanimatedSwipeable
        ref={ref}
        friction={2}
        overshootLeft={false}
        overshootRight={false}
        leftThreshold={36}
        rightThreshold={36}
        renderLeftActions={(progress) => (
          <SwipeAction
            progress={progress}
            side="left"
            color={c.primary}
            label="Edit"
            icon={<PencilIcon size={20} color="#fff" />}
            onPress={handleEdit}
          />
        )}
        renderRightActions={(progress) => (
          <SwipeAction
            progress={progress}
            side="right"
            color={c.danger}
            label="Delete"
            icon={<TrashIcon size={20} color="#fff" />}
            onPress={handleDelete}
          />
        )}
        containerStyle={styles.swipe}
      >
        <Pressable
          onPress={handleEdit}
          style={({ pressed }) => [
            styles.card,
            { backgroundColor: c.glassBg, borderColor: c.glassBorder },
            pressed ? styles.pressed : null,
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Edit ${transaction.note || meta.label}, ${formatCurrency(transaction.amount)}`}
        >
          <View style={styles.row}>
            <View style={[styles.icon, { backgroundColor: `${meta.color}29` }]}>
              <Text style={styles.emoji}>{meta.icon}</Text>
            </View>
            <View style={styles.mid}>
              <Text style={[styles.title, { color: c.text }]} numberOfLines={1}>
                {transaction.note || meta.label}
              </Text>
              <Text style={[styles.sub, { color: c.textMuted }]} numberOfLines={1}>
                {meta.label} · {formatDate(transaction.date)}
              </Text>
            </View>
            <Text style={[styles.amount, { color: isIncome ? c.success : c.danger }]}>
              {isIncome ? '+' : '-'}
              {formatCurrency(transaction.amount)}
            </Text>
          </View>
        </Pressable>
      </ReanimatedSwipeable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outer: { marginBottom: 10 },
  swipe: { borderRadius: 18 },
  card: { borderRadius: 18, borderWidth: 1, padding: 14 },
  pressed: { opacity: 0.85 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 20 },
  mid: { flex: 1 },
  title: { fontSize: 15, fontFamily: fontFamily.semibold },
  sub: { fontSize: 13, fontFamily: fontFamily.regular, marginTop: 2 },
  amount: { fontSize: 16, fontFamily: fontFamily.bold },
  actionWrap: { justifyContent: 'center', paddingHorizontal: 6 },
  actionLeft: { alignItems: 'flex-start' },
  actionRight: { alignItems: 'flex-end' },
  action: {
    width: 84,
    height: '88%',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  actionLabel: { color: '#fff', fontSize: 12, fontFamily: fontFamily.semibold },
});
