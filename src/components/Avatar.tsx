import { Image, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

interface AvatarProps {
  uri?: string | null;
  name: string;
  size?: number;
}

/** Circular avatar showing the user's image, or their initials as a fallback. */
export function Avatar({ uri, name, size = 96 }: AvatarProps) {
  const { colors } = useTheme();
  const initials = name
    .trim()
    .split(/\s+/)
    .map((part) => part[0] ?? '')
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const dimension = { width: size, height: size, borderRadius: size / 2 };

  if (uri) {
    return <Image source={{ uri }} style={[{ backgroundColor: colors.cardAlt }, dimension]} />;
  }

  return (
    <View style={[styles.fallback, { backgroundColor: colors.primary }, dimension]}>
      <Text style={[styles.initials, { color: colors.onPrimary, fontSize: size * 0.4 }]}>
        {initials || '?'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { alignItems: 'center', justifyContent: 'center' },
  initials: { fontWeight: '700' },
});
