import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { LogoMark } from '@/components/icons';
import { useAuthTheme } from '@/theme/authTheme';
import { fontFamily } from '@/theme/typography';

interface AuthHeaderProps {
  tagline?: string;
  compact?: boolean;
}

/** App logo + name + optional motivational tagline, with a soft entrance. */
export function AuthHeader({ tagline, compact = false }: AuthHeaderProps) {
  const { c } = useAuthTheme();
  return (
    <Animated.View entering={FadeInDown.duration(620)} style={styles.wrap}>
      <View style={[styles.logo, { shadowColor: c.glow }]}>
        <LogoMark size={compact ? 56 : 68} />
      </View>
      <Text style={[styles.name, { color: c.text }]}>ExpenSee</Text>
      {tagline ? <Text style={[styles.tagline, { color: c.textMuted }]}>{tagline}</Text> : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 10, marginBottom: 26 },
  logo: {
    borderRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 22,
    elevation: 12,
  },
  name: { fontSize: 26, fontFamily: fontFamily.bold, letterSpacing: -0.3 },
  tagline: { fontSize: 15, fontFamily: fontFamily.regular, textAlign: 'center', maxWidth: 280 },
});
