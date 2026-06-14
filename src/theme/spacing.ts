/**
 * Layout tokens — spacing, corner radii, control sizing and elevation.
 *
 * Use these instead of ad-hoc numbers so the app keeps a consistent rhythm.
 * Spacing follows a 4px base scale; combine them for screen padding, gaps and
 * insets. Pair `shadow.*` with a themed `shadowColor`/`backgroundColor` so it
 * degrades gracefully in both light and dark mode.
 */

/** 4px-based spacing scale. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

/** Corner radii. inputs/buttons → `md`, cards → `lg`, chips/pills → `xl`/`pill`. */
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

/** Standard control height for buttons and inputs. */
export const sizing = {
  control: 52,
} as const;

/**
 * Soft elevation presets (iOS shadow + Android elevation). `shadowColor`
 * defaults to black; override it (e.g. with a brand glow) and set the surface's
 * `backgroundColor` so the shadow reads correctly.
 */
export const shadow = {
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    shadowOpacity: 0.06,
    elevation: 1,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    shadowOpacity: 0.08,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 24,
    shadowOpacity: 0.12,
    elevation: 8,
  },
} as const;

export type Spacing = keyof typeof spacing;
export type Radius = keyof typeof radius;
