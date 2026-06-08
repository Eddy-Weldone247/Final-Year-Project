import { useTheme } from '@/hooks/useTheme';

/**
 * Premium auth-flow palette — a richer, more expressive layer than the app's
 * core tokens. Drives the glassmorphism + animated-gradient aesthetic of the
 * authentication screens (Splash → Welcome → Login → … → Verify).
 *
 * Color system:
 *   primary #3B82F6 · secondary #8B5CF6 · accent #06B6D4 · success #10B981
 */
export interface AuthPalette {
  // Animated background
  gradient: readonly [string, string, string];
  blobs: readonly [string, string, string]; // soft glow blob colors
  blurTint: 'light' | 'dark';
  blurIntensity: number;

  // Glass surfaces
  glassBg: string;
  glassBorder: string;
  glassHighlight: string; // top inner highlight line

  // Text
  text: string;
  textMuted: string;
  textFaint: string;

  // Inputs
  inputBg: string;
  inputBorder: string;
  inputIcon: string;

  // Brand / semantic
  primary: string;
  secondary: string;
  accent: string;
  success: string;
  danger: string;
  onPrimary: string;
  primaryGradient: readonly [string, string];
  glow: string; // primary glow used for shadows / button pulse
}

export const darkAuthPalette: AuthPalette = {
  gradient: ['#0F172A', '#131C31', '#1E293B'],
  blobs: ['#3B82F6', '#8B5CF6', '#06B6D4'],
  blurTint: 'dark',
  blurIntensity: 38,

  glassBg: 'rgba(255,255,255,0.06)',
  glassBorder: 'rgba(255,255,255,0.14)',
  glassHighlight: 'rgba(255,255,255,0.22)',

  text: '#F8FAFC',
  textMuted: '#94A3B8',
  textFaint: '#64748B',

  inputBg: 'rgba(255,255,255,0.05)',
  inputBorder: 'rgba(255,255,255,0.12)',
  inputIcon: '#94A3B8',

  primary: '#3B82F6',
  secondary: '#8B5CF6',
  accent: '#06B6D4',
  success: '#10B981',
  danger: '#F87171',
  onPrimary: '#FFFFFF',
  primaryGradient: ['#3B82F6', '#8B5CF6'],
  glow: 'rgba(59,130,246,0.45)',
};

export const lightAuthPalette: AuthPalette = {
  gradient: ['#EEF2FF', '#F8FAFC', '#FFFFFF'],
  blobs: ['#3B82F6', '#8B5CF6', '#06B6D4'],
  blurTint: 'light',
  blurIntensity: 28,

  glassBg: 'rgba(255,255,255,0.55)',
  glassBorder: 'rgba(255,255,255,0.75)',
  glassHighlight: 'rgba(255,255,255,0.95)',

  text: '#0F172A',
  textMuted: '#475569',
  textFaint: '#94A3B8',

  inputBg: 'rgba(255,255,255,0.7)',
  inputBorder: 'rgba(15,23,42,0.1)',
  inputIcon: '#64748B',

  primary: '#3B82F6',
  secondary: '#8B5CF6',
  accent: '#06B6D4',
  success: '#10B981',
  danger: '#DC2626',
  onPrimary: '#FFFFFF',
  primaryGradient: ['#3B82F6', '#8B5CF6'],
  glow: 'rgba(59,130,246,0.3)',
};

/** Resolves the active auth palette from the app's theme mode. */
export function useAuthTheme(): { isDark: boolean; c: AuthPalette } {
  const { isDark } = useTheme();
  return { isDark, c: isDark ? darkAuthPalette : lightAuthPalette };
}
