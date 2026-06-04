import { useColorScheme } from 'react-native';

import { useThemeStore } from '@/store/themeStore';
import { darkColors, lightColors, type ThemeColors } from '@/theme/palette';

/** Resolves the active palette from the saved mode + the OS color scheme. */
export function useTheme(): { isDark: boolean; colors: ThemeColors } {
  const mode = useThemeStore((state) => state.mode);
  const system = useColorScheme();
  const isDark = mode === 'system' ? system === 'dark' : mode === 'dark';
  return { isDark, colors: isDark ? darkColors : lightColors };
}
