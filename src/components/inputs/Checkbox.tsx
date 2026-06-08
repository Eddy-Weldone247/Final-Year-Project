import { useEffect } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { CheckIcon } from '@/components/icons';
import { useAuthTheme } from '@/theme/authTheme';
import { fontFamily } from '@/theme/typography';

interface CheckboxProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}

export function Checkbox({ checked, onChange, label }: CheckboxProps) {
  const { c } = useAuthTheme();
  const p = useSharedValue(checked ? 1 : 0);

  useEffect(() => {
    p.value = withTiming(checked ? 1 : 0, { duration: 160 });
  }, [checked, p]);

  const boxStyle = useAnimatedStyle(() => ({
    backgroundColor: checked ? c.primary : 'transparent',
    borderColor: checked ? c.primary : c.inputBorder,
  }));
  const checkStyle = useAnimatedStyle(() => ({
    opacity: p.value,
    transform: [{ scale: p.value }],
  }));

  return (
    <Pressable
      onPress={() => onChange(!checked)}
      style={styles.row}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      hitSlop={8}
    >
      <Animated.View style={[styles.box, boxStyle]}>
        <Animated.View style={checkStyle}>
          <CheckIcon size={12} color={c.onPrimary} strokeWidth={3} />
        </Animated.View>
      </Animated.View>
      <Text style={[styles.label, { color: c.textMuted }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  box: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: 13, fontFamily: fontFamily.medium },
});
