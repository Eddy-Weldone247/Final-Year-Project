import { type NativeStackScreenProps } from '@react-navigation/native-stack';
import { Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { AuthLayout } from '@/components/auth/AuthLayout';
import { GlassCard } from '@/components/cards/GlassCard';
import { config } from '@/constants/config';
import { ensureNotificationPermission } from '@/services/notifications';
import { isSmsReadingAvailable, requestSmsPermission } from '@/services/sms/smsReader';
import { useSettingsStore } from '@/store/settingsStore';
import { useThemeStore, type ThemeMode } from '@/store/themeStore';
import { type AuthPalette, useAuthTheme } from '@/theme/authTheme';
import { fontFamily } from '@/theme/typography';
import type { ProfileStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Settings'>;

const APPEARANCE_OPTIONS: { label: string; value: ThemeMode }[] = [
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
  { label: 'System', value: 'system' },
];

function AppearanceSegmented({ c }: { c: AuthPalette }) {
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);
  return (
    <View style={[styles.segmented, { backgroundColor: c.inputBg, borderColor: c.inputBorder }]}>
      {APPEARANCE_OPTIONS.map((o) => {
        const active = mode === o.value;
        return (
          <Pressable
            key={o.value}
            onPress={() => setMode(o.value)}
            style={styles.segItem}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <View style={[styles.segInner, active ? { backgroundColor: c.primary } : null]}>
              <Text style={[styles.segText, { color: active ? c.onPrimary : c.textMuted }]}>
                {o.label}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

function ToggleRow({
  c,
  title,
  sub,
  value,
  onValueChange,
  disabled,
}: {
  c: AuthPalette;
  title: string;
  sub: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleText}>
        <Text style={[styles.toggleTitle, { color: c.text }]}>{title}</Text>
        <Text style={[styles.toggleSub, { color: c.textMuted }]}>{sub}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ true: c.primary, false: c.inputBorder }}
        thumbColor={c.onPrimary}
      />
    </View>
  );
}

function NotificationToggles({ c }: { c: AuthPalette }) {
  const moneyIn = useSettingsStore((s) => s.notifMoneyIn);
  const setMoneyIn = useSettingsStore((s) => s.setNotifMoneyIn);
  const daily = useSettingsStore((s) => s.notifDailyReminder);
  const setDaily = useSettingsStore((s) => s.setNotifDailyReminder);
  const budget = useSettingsStore((s) => s.notifBudgetAlerts);
  const setBudget = useSettingsStore((s) => s.setNotifBudgetAlerts);
  const weekly = useSettingsStore((s) => s.notifWeeklySummary);
  const setWeekly = useSettingsStore((s) => s.setNotifWeeklySummary);

  // Turning any toggle on requests OS permission first; off just clears it.
  const guarded = (setter: (value: boolean) => void) => async (value: boolean) => {
    if (value) {
      const granted = await ensureNotificationPermission();
      if (!granted) {
        Alert.alert(
          'Allow notifications',
          'Enable notifications for ExpenSee in your device settings to receive alerts.',
        );
        return;
      }
    }
    setter(value);
  };

  const divider = () => <View style={[styles.divider, { backgroundColor: c.glassBorder }]} />;

  return (
    <View style={styles.toggleGroup}>
      <ToggleRow
        c={c}
        title="Money received"
        sub="Get notified when income is added to your account."
        value={moneyIn}
        onValueChange={guarded(setMoneyIn)}
      />
      {divider()}
      <ToggleRow
        c={c}
        title="Daily reminder"
        sub="A nudge at 8 PM to log the day's expenses."
        value={daily}
        onValueChange={guarded(setDaily)}
      />
      {divider()}
      <ToggleRow
        c={c}
        title="Budget alerts"
        sub="When you approach or exceed a monthly budget."
        value={budget}
        onValueChange={guarded(setBudget)}
      />
      {divider()}
      <ToggleRow
        c={c}
        title="Weekly summary"
        sub="A recap of your week, every Sunday evening."
        value={weekly}
        onValueChange={guarded(setWeekly)}
      />
    </View>
  );
}

function SmsToggle({ c }: { c: AuthPalette }) {
  const enabled = useSettingsStore((s) => s.autoCaptureSms);
  const setEnabled = useSettingsStore((s) => s.setAutoCaptureSms);
  const available = isSmsReadingAvailable();

  const onToggle = async (value: boolean) => {
    if (value) {
      const granted = await requestSmsPermission();
      if (!granted) {
        Alert.alert('Permission needed', 'Allow SMS access to auto-capture transactions.');
        return;
      }
    }
    setEnabled(value);
  };

  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleText}>
        <Text style={[styles.toggleTitle, { color: c.text }]}>Auto-capture new SMS</Text>
        <Text style={[styles.toggleSub, { color: c.textMuted }]}>
          {available
            ? "Scans when you open the app and periodically while it's open, creating transactions automatically."
            : 'Requires a development build on Android (not available in Expo Go).'}
        </Text>
      </View>
      <Switch
        value={enabled && available}
        onValueChange={onToggle}
        disabled={!available}
        trackColor={{ true: c.primary, false: c.inputBorder }}
        thumbColor={c.onPrimary}
      />
    </View>
  );
}

function AboutRow({ label, value, c }: { label: string; value: string; c: AuthPalette }) {
  return (
    <View style={styles.aboutRow}>
      <Text style={[styles.aboutLabel, { color: c.textMuted }]}>{label}</Text>
      <Text style={[styles.aboutValue, { color: c.text }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

export function SettingsScreen({ navigation }: Props) {
  const { c } = useAuthTheme();

  return (
    <AuthLayout center={false} onBack={() => navigation.goBack()}>
      <Text style={[styles.title, { color: c.text }]}>Settings</Text>

      <Text style={[styles.section, { color: c.textFaint }]}>APPEARANCE</Text>
      <GlassCard delay={60}>
        <AppearanceSegmented c={c} />
      </GlassCard>

      <Text style={[styles.section, { color: c.textFaint }]}>NOTIFICATIONS</Text>
      <GlassCard delay={100}>
        <NotificationToggles c={c} />
      </GlassCard>

      <Text style={[styles.section, { color: c.textFaint }]}>SMS</Text>
      <GlassCard delay={140}>
        <SmsToggle c={c} />
      </GlassCard>

      <Text style={[styles.section, { color: c.textFaint }]}>ABOUT</Text>
      <GlassCard delay={180}>
        <View style={styles.about}>
          <AboutRow label="App" value="ExpenSee" c={c} />
          <View style={[styles.divider, { backgroundColor: c.glassBorder }]} />
          <AboutRow label="API" value={config.apiUrl} c={c} />
        </View>
      </GlassCard>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontFamily: fontFamily.bold, letterSpacing: -0.4, marginBottom: 18 },
  section: {
    fontSize: 12,
    fontFamily: fontFamily.bold,
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 6,
  },
  segmented: { flexDirection: 'row', borderRadius: 12, borderWidth: 1, padding: 4 },
  segItem: { flex: 1 },
  segInner: { alignItems: 'center', justifyContent: 'center', borderRadius: 9, paddingVertical: 9 },
  segText: { fontSize: 14, fontFamily: fontFamily.semibold },
  toggleGroup: { gap: 14 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  toggleText: { flex: 1, gap: 3 },
  toggleTitle: { fontSize: 15, fontFamily: fontFamily.semibold },
  toggleSub: { fontSize: 13, lineHeight: 18, fontFamily: fontFamily.regular },
  about: { gap: 12 },
  aboutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  aboutLabel: { fontSize: 15, fontFamily: fontFamily.medium },
  aboutValue: { fontSize: 14, fontFamily: fontFamily.medium, flexShrink: 1 },
  divider: { height: 1, opacity: 0.7 },
});
