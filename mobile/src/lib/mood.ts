import { colors, onThemeChange } from '@/theme/tokens';
import { mixOklch } from './oklch';
import type { Radii } from './blob';

export const MOODS = [
  ['Heavy', 'Go easy tonight'],
  ['Low', 'That counts too'],
  ['Okay', 'Somewhere in the middle'],
  ['Good', 'Nice. Hold onto it'],
  ['Bright', 'Let’s catch this one'],
] as const;

export const moodIndex = (v: number): 0 | 1 | 2 | 3 | 4 => {
  'worklet'; // also read on the UI thread while dragging
  return Math.min(4, Math.floor(v / 20.001)) as 0 | 1 | 2 | 3 | 4;
};

export const moodColor = (v: number): string => mixOklch(colors.moodLow, colors.moodHigh, v / 100);

/**
 * The colour for every whole mood 0-100, so a drag can look colours up on the UI thread instead of mixing OKLCH per
 * frame. One array for the life of the app: it is refilled in place when the theme changes (the app remounts after).
 */
export const MOOD_COLORS: string[] = Array.from({ length: 101 }, (_, i) => moodColor(i));
onThemeChange(() => MOOD_COLORS.forEach((_, i) => { MOOD_COLORS[i] = moodColor(i); }));

/**
 * The colour for a mood while dragging, on the UI thread. Pass the table in (a copy of MOOD_COLORS taken while rendering):
 * a worklet that read MOOD_COLORS itself would keep the table from the first theme for good.
 */
export const moodColorAt = (v: number, table: readonly string[]): string => {
  'worklet';
  return table[Math.round(Math.min(100, Math.max(0, v)))];
};

export const moodRotation = (v: number): number => Math.round(-12 + v * 0.24);

const LO = [62, 38, 34, 66, 70, 44, 56, 30] as const; // droopy
const HI = [44, 56, 58, 42, 40, 42, 58, 60] as const; // lifted

export const moodRadii = (v: number): Radii =>
  LO.map((a, i) => Math.round(a + (HI[i] - a) * (v / 100))) as unknown as Radii;
