import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { BlurView } from 'expo-blur';
import { type ReactNode, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { PressableScale } from '@/components/animations/PressableScale';
import { CalendarIcon } from '@/components/icons';
import { useAuthTheme } from '@/theme/authTheme';
import { fontFamily } from '@/theme/typography';
import { formatDate } from '@/utils/formatCurrency';

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function sameDay(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

function DateChip({
  label,
  active,
  onPress,
  icon,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  icon?: ReactNode;
}) {
  const { c } = useAuthTheme();
  return (
    <PressableScale onPress={onPress} scaleTo={0.94} accessibilityLabel={label}>
      <View
        style={[
          styles.chip,
          {
            backgroundColor: active ? `${c.primary}26` : c.inputBg,
            borderColor: active ? c.primary : c.inputBorder,
          },
        ]}
      >
        {icon}
        <Text style={[styles.chipText, { color: active ? c.primary : c.textMuted }]}>{label}</Text>
      </View>
    </PressableScale>
  );
}

interface DateFieldProps {
  value: Date;
  onChange: (date: Date) => void;
}

/** Quick-select date chips (Today/Yesterday) + native picker for any other day. */
export function DateField({ value, onChange }: DateFieldProps) {
  const { c, isDark } = useAuthTheme();
  const [show, setShow] = useState(false);

  const today = new Date();
  const yesterday = new Date(Date.now() - 86_400_000);
  const isToday = sameDay(value, today);
  const isYesterday = sameDay(value, yesterday);
  const isCustom = !isToday && !isYesterday;

  const onPick = (event: DateTimePickerEvent, picked?: Date) => {
    if (Platform.OS !== 'ios') setShow(false);
    if (event.type === 'set' && picked) onChange(picked);
  };

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: c.textMuted }]}>Date</Text>
      <View style={styles.row}>
        <DateChip label="Today" active={isToday} onPress={() => onChange(new Date())} />
        <DateChip
          label="Yesterday"
          active={isYesterday}
          onPress={() => onChange(new Date(Date.now() - 86_400_000))}
        />
        <DateChip
          label={isCustom ? formatDate(value.toISOString()) : 'Pick date'}
          active={isCustom}
          icon={<CalendarIcon size={16} color={isCustom ? c.primary : c.inputIcon} />}
          onPress={() => setShow(true)}
        />
      </View>

      {show &&
        (Platform.OS === 'ios' ? (
          <BlurView
            intensity={c.blurIntensity}
            tint={c.blurTint}
            experimentalBlurMethod="dimezisBlurView"
            style={styles.iosClip}
          >
            <View
              style={[styles.iosPanel, { backgroundColor: c.glassBg, borderColor: c.glassBorder }]}
            >
              <DateTimePicker
                value={value}
                mode="date"
                display="inline"
                maximumDate={today}
                themeVariant={isDark ? 'dark' : 'light'}
                accentColor={c.primary}
                onChange={(_e, d) => d && onChange(d)}
              />
              <Pressable onPress={() => setShow(false)} style={styles.done} hitSlop={8}>
                <Text style={[styles.doneText, { color: c.primary }]}>Done</Text>
              </Pressable>
            </View>
          </BlurView>
        ) : (
          <DateTimePicker
            value={value}
            mode="date"
            display="default"
            maximumDate={today}
            onChange={onPick}
          />
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  label: { fontSize: 14, fontFamily: fontFamily.medium },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  chipText: { fontSize: 13, fontFamily: fontFamily.semibold },
  iosClip: { borderRadius: 20, overflow: 'hidden', marginTop: 4 },
  iosPanel: { borderRadius: 20, borderWidth: 1, padding: 8 },
  done: { alignSelf: 'flex-end', paddingHorizontal: 12, paddingVertical: 8 },
  doneText: { fontSize: 15, fontFamily: fontFamily.semibold },
});
