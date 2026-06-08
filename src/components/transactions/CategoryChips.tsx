import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { PressableScale } from '@/components/animations/PressableScale';
import { CATEGORIES, type CategoryMeta } from '@/constants/categories';
import { useAuthTheme } from '@/theme/authTheme';
import { fontFamily } from '@/theme/typography';
import type { Category } from '@/types/transaction';

function Chip({
  meta,
  selected,
  onPress,
}: {
  meta: CategoryMeta;
  selected: boolean;
  onPress: () => void;
}) {
  const { c } = useAuthTheme();
  const p = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    p.value = selected
      ? withSpring(1, { damping: 14, stiffness: 200 })
      : withTiming(0, { duration: 160 });
  }, [selected, p]);

  const animated = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(p.value, [0, 1], [c.inputBg, `${meta.color}29`]),
    borderColor: interpolateColor(p.value, [0, 1], [c.inputBorder, meta.color]),
    transform: [{ scale: 1 + p.value * 0.04 }],
  }));

  return (
    <PressableScale onPress={onPress} scaleTo={0.93} accessibilityLabel={meta.label}>
      <Animated.View style={[styles.chip, animated]}>
        <Text style={styles.icon}>{meta.icon}</Text>
        <Text
          style={[styles.label, { color: selected ? meta.color : c.textMuted }]}
          numberOfLines={1}
        >
          {meta.label}
        </Text>
      </Animated.View>
    </PressableScale>
  );
}

interface CategoryChipsProps {
  value: Category;
  onChange: (category: Category) => void;
}

/** Wrapping grid of glass category chips with an animated selection state. */
export function CategoryChips({ value, onChange }: CategoryChipsProps) {
  return (
    <View style={styles.grid}>
      {CATEGORIES.map((meta) => (
        <Chip
          key={meta.value}
          meta={meta}
          selected={meta.value === value}
          onPress={() => onChange(meta.value)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 14,
    borderWidth: 1,
  },
  icon: { fontSize: 15 },
  label: { fontSize: 13, fontFamily: fontFamily.semibold },
});
