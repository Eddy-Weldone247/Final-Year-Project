import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AutoCaptureToggle } from '@/components/AutoCaptureToggle';
import { FadeInView } from '@/components/FadeInView';
import { ScreenContainer } from '@/components/ScreenContainer';
import { config } from '@/constants/config';
import { useTheme } from '@/hooks/useTheme';
import type { ThemeColors } from '@/theme/palette';
import { useThemeStore, type ThemeMode } from '@/store/themeStore';

const APPEARANCE_OPTIONS: { label: string; value: ThemeMode }[] = [
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
  { label: 'System', value: 'system' },
];

export function SettingsScreen() {
  const { colors } = useTheme();
  return (
    <ScreenContainer center={false}>
      <FadeInView style={styles.content}>
        <Text style={[styles.section, { color: colors.placeholder }]}>Appearance</Text>
        <AppearanceToggle colors={colors} />

        <Text style={[styles.section, { color: colors.placeholder }]}>SMS</Text>
        <AutoCaptureToggle />

        <Text style={[styles.section, { color: colors.placeholder }]}>About</Text>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Row label="App" value="ExpenSee" colors={colors} />
          <Row label="API" value={config.apiUrl} colors={colors} />
        </View>
      </FadeInView>
    </ScreenContainer>
  );
}

function AppearanceToggle({ colors }: { colors: ThemeColors }) {
  const mode = useThemeStore((state) => state.mode);
  const setMode = useThemeStore((state) => state.setMode);

  return (
    <View style={[styles.segment, { backgroundColor: colors.cardAlt }]}>
      {APPEARANCE_OPTIONS.map((option) => {
        const active = mode === option.value;
        return (
          <Pressable
            key={option.value}
            onPress={() => setMode(option.value)}
            style={[styles.segmentBtn, active ? { backgroundColor: colors.primary } : null]}
          >
            <Text
              style={[
                styles.segmentText,
                { color: active ? colors.onPrimary : colors.textSecondary },
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function Row({ label, value, colors }: { label: string; value: string; colors: ThemeColors }) {
  return (
    <View style={styles.aboutRow}>
      <Text style={[styles.aboutLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.aboutValue, { color: colors.textMuted }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: 16 },
  section: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 8,
    textTransform: 'uppercase',
  },
  segment: { borderRadius: 10, flexDirection: 'row', padding: 4 },
  segmentBtn: { alignItems: 'center', borderRadius: 8, flex: 1, paddingVertical: 9 },
  segmentText: { fontSize: 14, fontWeight: '600' },
  card: { borderRadius: 12, padding: 16 },
  aboutRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  aboutLabel: { fontSize: 15 },
  aboutValue: { fontSize: 14, flexShrink: 1 },
});
