/**
 * Typography system (Inter). Font families map to the weights loaded in
 * `App.tsx` via `@expo-google-fonts/inter`. If fonts haven't loaded yet, React
 * Native falls back to the system font gracefully.
 */
export const fontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
} as const;

export const fontSize = {
  hero: 40,
  heading: 32,
  title: 22,
  subheading: 18,
  body: 16,
  caption: 14,
  small: 12,
} as const;

/**
 * Reusable text style presets. Spread into a `Text` style and override color.
 * Line-heights are tuned for comfortable vertical rhythm; display styles use
 * tighter negative tracking, body styles stay open for readability.
 */
export const typography = {
  hero: {
    fontFamily: fontFamily.extrabold,
    fontSize: fontSize.hero,
    lineHeight: 46,
    letterSpacing: -0.5,
  },
  heading: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.heading,
    lineHeight: 38,
    letterSpacing: -0.4,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.title,
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  subheading: { fontFamily: fontFamily.semibold, fontSize: fontSize.subheading, lineHeight: 24 },
  body: { fontFamily: fontFamily.regular, fontSize: fontSize.body, lineHeight: 24 },
  bodyMedium: { fontFamily: fontFamily.medium, fontSize: fontSize.body, lineHeight: 24 },
  caption: { fontFamily: fontFamily.medium, fontSize: fontSize.caption, lineHeight: 20 },
  small: { fontFamily: fontFamily.medium, fontSize: fontSize.small, lineHeight: 16 },
  button: { fontFamily: fontFamily.semibold, fontSize: fontSize.body, letterSpacing: 0.2 },
} as const;

/** Inter weights to load at startup. */
export { default as interFonts } from './interFonts';
