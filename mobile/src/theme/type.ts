import type { TextStyle } from 'react-native';
import { fontFamily } from './fonts';
import { colors } from './tokens';

// Every text style carries the page's ink colour, so a Text that doesn't pick its own is never the system default
// (black), which vanishes on the dark page. A colour set later in a style array still wins.

/** Caprasimo display text. Screen titles use lineHeight 1.08–1.1 and letterSpacing -0.015em. */
export const heading = (size: number, lineHeight = 1.1): TextStyle => ({
  color: colors.text,
  fontFamily: fontFamily.heading,
  fontSize: size,
  lineHeight: Math.round(size * lineHeight),
  letterSpacing: size >= 28 ? -0.015 * size : 0,
});

export const body = (size: number, weight: 'body' | 'semi' | 'bold' = 'body', lineHeight?: number): TextStyle => ({
  color: colors.text,
  fontFamily: fontFamily[weight],
  fontSize: size,
  ...(lineHeight ? { lineHeight: Math.round(size * lineHeight) } : null),
});
