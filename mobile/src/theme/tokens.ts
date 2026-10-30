import type { ViewStyle } from 'react-native';

/**
 * Two palettes share one set of names.
 *
 * "Lamplight" (dark, the default): a night-time palette for writing at the end of the day. A deep spruce-ink neutral
 * (hue ~205) carries the surfaces; warm paper-cream carries the words; lamp amber is the one action colour; tide teal
 * is the quiet second voice (friends, selection, calm). Designed in OKLCH and checked for contrast: body text 15:1,
 * secondary text 8:1, button text 8.7:1.
 *
 * "Daylight" (light): a warm peach page, cream cards and aubergine ink, with the same amber action and tide teal.
 * Its mood colours are deeper than Lamplight's so they still stand out on a light page (3:1) and still take dark
 * numerals (4.5:1).
 *
 * Steps run by emphasis, not by light to dark: 100 is the quietest surface and 900 the loudest ink. So `neutral[100]`
 * is a raised card, `neutral[700]` is secondary text, `accent[200]` is a tinted panel and `accent[900]` is the ink
 * that sits on it. Pairs such as accent[200] with accent[900] keep their contrast in both themes; reuse them as pairs.
 *
 * `colors`, `ramp` and `shadows` are the live values of the current theme. `applyTheme()` changes them in place, and
 * the app remounts afterwards (see `app/_layout.tsx`), so read them while rendering, never at module load: a constant
 * built from them at import time keeps the first theme's colours. `themedStyles()` is the safe way to make a
 * StyleSheet from them, and `noModuleLevelTokens.test.ts` guards the rest.
 */
export type ThemeName = 'dark' | 'light';

type Steps = Record<100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900, string>;

interface Theme {
  colors: {
    bg: string; surface: string; paper: string; paperInk: string; text: string; divider: string; accent: string;
    accent2: string; scrim: string; danger: string; moodLow: string; moodHigh: string;
    /** Text and icons that sit on the amber action, the teal selection and the mood colours. */
    onAccent: string;
  };
  ramp: { accent: Steps; accent2: Steps; neutral: Steps };
  shadowColor: string;
  /** Opacity of the three shadow sizes: a dark page needs them stronger than a light one. */
  shadowOpacity: [number, number, number];
  statusBar: 'light' | 'dark';
}

const THEMES: Record<ThemeName, Theme> = {
  dark: {
    colors: {
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
      onAccent: '#081a1c',
    },
    ramp: {
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
    },
    shadowColor: '#010708',
    shadowOpacity: [0.32, 0.38, 0.5],
    statusBar: 'light',
  },
  light: {
    colors: {
      bg: '#f8e7d0',
      surface: '#fdf6ea',
      paper: '#faf7ee',
      paperInk: '#2e2b25',
      text: '#381e20',
      divider: 'rgba(56,30,32,0.14)',
      accent: '#eca338',
      accent2: '#5fb7a5',
      scrim: 'rgba(56,30,32,0.45)',
      danger: '#b02b27',
      moodLow: '#817dc7',
      moodHigh: '#d46600',
      onAccent: '#221012',
    },
    ramp: {
      accent: {
        100: '#fff1d6', 200: '#ffe3b4', 300: '#fdcb84', 400: '#eaa950', 500: '#dd9225',
        600: '#c37902', 700: '#7d460b', 800: '#5c300b', 900: '#401f0a',
      },
      accent2: {
        100: '#e1f8f2', 200: '#c6efe4', 300: '#9fe1d1', 400: '#6cc4b1', 500: '#4cac98',
        600: '#5fb7a5', 700: '#0a6355', 800: '#0d473d', 900: '#093029',
      },
      neutral: {
        100: '#fefaf1', 200: '#f8efe0', 300: '#eadcc9', 400: '#d3c1ac', 500: '#79635f',
        600: '#705654', 700: '#614444', 800: '#482d2f', 900: '#381e20',
      },
    },
    shadowColor: '#381e20',
    shadowOpacity: [0.1, 0.14, 0.2],
    statusBar: 'dark',
  },
};

const copy = <T extends object>(o: T): T => ({ ...o });

export const colors: Theme['colors'] = copy(THEMES.dark.colors);
export const ramp: Theme['ramp'] = { accent: copy(THEMES.dark.ramp.accent), accent2: copy(THEMES.dark.ramp.accent2), neutral: copy(THEMES.dark.ramp.neutral) };

export const radii = { pill: 999, card: 28, container: 32, sheet: 32, photo: 24, fab: 22 } as const;

export const layout = {
  screenPadding: 22,
  navHeight: 76,
  hitTarget: 44,
  fabHeight: 60,
  fabInset: 18,
} as const;

const shadow = (color: string, opacity: number, offsetY: number, radius: number, elevation: number): ViewStyle => ({
  shadowColor: color,
  shadowOffset: { width: 0, height: offsetY },
  shadowRadius: radius,
  shadowOpacity: opacity,
  elevation,
});

const shadowsFor = (t: Theme) => ({
  sm: shadow(t.shadowColor, t.shadowOpacity[0], 1, 2, 1),
  md: shadow(t.shadowColor, t.shadowOpacity[1], 3, 10, 3),
  lg: shadow(t.shadowColor, t.shadowOpacity[2], 12, 32, 8),
});

export const shadows: ReturnType<typeof shadowsFor> = shadowsFor(THEMES.dark);

let current: ThemeName = 'dark';
const listeners = new Set<() => void>();

export const getTheme = (): ThemeName => current;
export const statusBarStyle = (): 'light' | 'dark' => THEMES[current].statusBar;

/** Anything derived from the colours (like the mood colour table) can refresh itself when the theme changes. */
export const onThemeChange = (fn: () => void): (() => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

/** Switch the live `colors`, `ramp` and `shadows` to a theme. Anything unrecognised is treated as dark. */
export function applyTheme(name: string): ThemeName {
  const next: ThemeName = name === 'light' ? 'light' : 'dark';
  if (next === current) return current;
  const t = THEMES[next];
  Object.assign(colors, t.colors);
  Object.assign(ramp.accent, t.ramp.accent);
  Object.assign(ramp.accent2, t.ramp.accent2);
  Object.assign(ramp.neutral, t.ramp.neutral);
  Object.assign(shadows, shadowsFor(t));
  current = next;
  listeners.forEach((fn) => fn());
  return current;
}
