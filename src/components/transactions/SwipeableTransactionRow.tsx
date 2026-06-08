import { type ReactNode, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, {
  Extrapolation,
  FadeIn,
  FadeInDown,
  FadeOut,
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

function DetailRow({
  label,
  value,
  color,
  muted,
}: {
  label: string;
  value: string;
  color: string;
  muted: string;
}) {
  return (
    <View style={styles.detailRow}>
      <Text style={[styles.detailLabel, { color: muted }]}>{label}</Text>
      <Text style={[styles.detailValue, { color }]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

interface Props {
  transaction: Transaction;
  index: number;
  onEdit: (t: Transaction) => void;
  onDelete: (t: Transaction) => void;
}

/** A glass transaction card with swipe-to-edit / swipe-to-delete and tap-to-expand. */
export function SwipeableTransactionRow({ transaction, index, onEdit, onDelete }: Props) {
  const { c } = useAuthTheme();
  const ref = useRef<SwipeableMethods>(null);
  const [expanded, setExpanded] = useState(false);

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
          onPress={() => setExpanded((e) => !e)}
          style={({ pressed }) => [
            styles.card,
            { backgroundColor: c.glassBg, borderColor: c.glassBorder },
            pressed ? styles.pressed : null,
          ]}
          accessibilityRole="button"
          accessibilityLabel={`${transaction.note || meta.label}, ${formatCurrency(transaction.amount)}`}
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

          {expanded ? (
            <Animated.View
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(150)}
              style={styles.details}
            >
              <View style={[styles.divider, { backgroundColor: c.glassBorder }]} />
              <DetailRow
                label="Type"
                value={isIncome ? 'Income' : 'Expense'}
                color={c.text}
                muted={c.textMuted}
              />
              <DetailRow label="Category" value={meta.label} color={c.text} muted={c.textMuted} />
              <DetailRow
                label="Date"
                value={formatDate(transaction.date)}
                color={c.text}
                muted={c.textMuted}
              />
              {transaction.note ? (
                <DetailRow
                  label="Note"
                  value={transaction.note}
                  color={c.text}
                  muted={c.textMuted}
                />
              ) : null}
              <View style={styles.quickActions}>
                <PressableScale
                  onPress={handleEdit}
                  style={[styles.quickBtn, { borderColor: c.glassBorder }]}
                >
                  <PencilIcon size={16} color={c.primary} />
                  <Text style={[styles.quickText, { color: c.primary }]}>Edit</Text>
                </PressableScale>
                <PressableScale
                  onPress={handleDelete}
                  style={[styles.quickBtn, { borderColor: c.glassBorder }]}
                >
                  <TrashIcon size={16} color={c.danger} />
                  <Text style={[styles.quickText, { color: c.danger }]}>Delete</Text>
                </PressableScale>
              </View>
            </Animated.View>
          ) : null}
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
  details: { marginTop: 12, gap: 10 },
  divider: { height: 1, opacity: 0.7, marginBottom: 2 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 16 },
  detailLabel: { fontSize: 13, fontFamily: fontFamily.medium },
  detailValue: { fontSize: 13, fontFamily: fontFamily.semibold, flexShrink: 1, textAlign: 'right' },
  quickActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  quickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  quickText: { fontSize: 13, fontFamily: fontFamily.semibold },
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
