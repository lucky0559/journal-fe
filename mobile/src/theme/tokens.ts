import type { ViewStyle } from 'react-native';

/**
 * "Lamplight": a night-time palette for writing at the end of the day. A deep spruce-ink neutral (hue ~205) carries
 * the surfaces; warm paper-cream carries the words; lamp amber is the one action colour; tide teal is the quiet second
 * voice (friends, selection, calm). Designed in OKLCH and checked for contrast: body text 15:1, secondary text 8:1,
 * button text 8.7:1.
 *
 * Steps run by emphasis, not by light to dark: 100 is the quietest surface and 900 the loudest ink. So `neutral[100]`
 * is a raised card, `neutral[700]` is secondary text, `accent[200]` is a tinted panel and `accent[900]` is the ink
 * that sits on it. Pairs such as accent[200] with accent[900] keep their contrast; reuse them as pairs.
 */
export const ramp = {
  accent: {
    100: '#33230f', 200: '#432d0e', 300: '#5d3d0e', 400: '#9d6810', 500: '#da942c',
    600: '#c48218', 700: '#f0b871', 800: '#fad3a4', 900: '#ffebd2',
  },
  accent2: {
    100: '#142a25', 200: '#153730', 300: '#1d4d44', 400: '#357669', 500: '#449786',
    600: '#5fb7a5', 700: '#86d2c1', 800: '#b5e3d7', 900: '#d7f2eb',
  },
  neutral: {
    100: '#182c2e', 200: '#223639', 300: '#304446', 400: '#45585a', 500: '#768786',
    600: '#8c978e', 700: '#b5b1a6', 800: '#d2cdc2', 900: '#ede7db',
  },
} as const;

export const colors = {
  bg: '#081a1c',
  surface: '#112527',
  paper: '#faf7ee', // the white of a photo's border: a printed photo stays light on the dark page
  paperInk: '#2e2b25', // text that sits on `paper`
  text: '#f1ebdc',
  divider: 'rgba(241,235,220,0.14)',
  accent: '#eca338',
  accent2: '#5fb7a5',
  scrim: 'rgba(2,10,11,0.62)',
  /** Errors and destructive actions: a soft coral, so amber stays the colour of "go". */
  danger: '#f69186',
  /** The two ends of the mood scale: dusk violet when it's heavy, lamp amber when it's bright. */
  moodLow: '#7a77ba',
  moodHigh: '#f8ac3d',
} as const;

export const radii = { pill: 999, card: 28, container: 32, sheet: 32, photo: 24, fab: 22 } as const;

export const layout = {
  screenPadding: 22,
  navHeight: 76,
  hitTarget: 44,
  fabHeight: 60,
  fabInset: 18,
} as const;

const shadow = (offsetY: number, radius: number, opacity: number, elevation: number): ViewStyle => ({
  shadowColor: '#010708',
  shadowOffset: { width: 0, height: offsetY },
  shadowRadius: radius,
  shadowOpacity: opacity,
  elevation,
});

export const shadows = {
  sm: shadow(1, 2, 0.32, 1),
  md: shadow(3, 10, 0.38, 3),
  lg: shadow(12, 32, 0.5, 8),
} as const;
