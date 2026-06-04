import { Alert, StyleSheet, Switch, Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { isSmsReadingAvailable, requestSmsPermission } from '@/services/sms/smsReader';
import { useSettingsStore } from '@/store/settingsStore';

/** Toggle for opt-in SMS auto-capture. Disabled (with a note) in Expo Go. */
export function AutoCaptureToggle() {
  const { colors } = useTheme();
  const enabled = useSettingsStore((state) => state.autoCaptureSms);
  const setEnabled = useSettingsStore((state) => state.setAutoCaptureSms);
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
    <View style={[styles.row, { backgroundColor: colors.card }]}>
      <View style={styles.text}>
        <Text style={[styles.title, { color: colors.text }]}>Auto-capture new SMS</Text>
        <Text style={[styles.sub, { color: colors.textMuted }]}>
          {available
            ? "Scans when you open the app and periodically while it's open, creating transactions automatically."
            : 'Requires a development build on Android (not available in Expo Go).'}
        </Text>
      </View>
      <Switch
        value={enabled && available}
        onValueChange={onToggle}
        disabled={!available}
        trackColor={{ true: colors.primary, false: colors.inputBorder }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 12,
    padding: 16,
  },
  text: { flex: 1 },
  title: { fontSize: 15, fontWeight: '600' },
  sub: { fontSize: 13, marginTop: 2 },
});
