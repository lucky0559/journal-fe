import type { ViewStyle } from 'react-native';

export const ramp = {
  accent: {
    100: '#fff2eb', 200: '#ffe1d0', 300: '#ffc6a5', 400: '#f6a06b', 500: '#d67f48',
    600: '#b2622d', 700: '#8c491a', 800: '#643312', 900: '#402310',
  },
  accent2: {
    100: '#f0fae1', 200: '#e1eecc', 300: '#ccdbb2', 400: '#aebf92', 500: '#8fa073',
    600: '#728157', 700: '#56633f', 800: '#3d472b', 900: '#272e1b',
  },
  neutral: {
    100: '#f9f4ed', 200: '#eee7db', 300: '#dcd3c4', 400: '#c0b6a5', 500: '#a19786',
    600: '#82796a', 700: '#645c50', 800: '#474238', 900: '#2e2b25',
  },
} as const;

export const colors = {
  bg: '#f5ead8',
  surface: '#ebddc5',
  paper: '#fffdf8', // the white of a photo's border
  text: '#201e1d',
  divider: 'rgba(32,30,29,0.16)',
  accent: '#c67139',
  accent2: '#7a8a5e',
  scrim: 'rgba(46,43,37,0.35)', // neutral-900 at 35%
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
  shadowColor: ramp.neutral[900],
  shadowOffset: { width: 0, height: offsetY },
  shadowRadius: radius,
  shadowOpacity: opacity,
  elevation,
});

export const shadows = {
  sm: shadow(1, 2, 0.14, 1),
  md: shadow(3, 10, 0.16, 3),
  lg: shadow(12, 32, 0.22, 8),
} as const;
