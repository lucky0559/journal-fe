import { ramp } from '@/theme/tokens';
import { mixOklch } from './oklch';
import type { Radii } from './blob';

export const MOODS = [
  ['Heavy', 'Go easy tonight'],
  ['Low', 'That counts too'],
  ['Okay', 'Somewhere in the middle'],
  ['Good', 'Nice. Hold onto it'],
  ['Bright', 'Let’s catch this one'],
] as const;

export const moodIndex = (v: number): 0 | 1 | 2 | 3 | 4 => Math.min(4, Math.floor(v / 20.001)) as 0 | 1 | 2 | 3 | 4;

export const moodColor = (v: number): string => mixOklch(ramp.accent2[600], ramp.accent[500], v / 100);

export const moodRotation = (v: number): number => Math.round(-12 + v * 0.24);

const LO = [62, 38, 34, 66, 70, 44, 56, 30] as const; // droopy
const HI = [44, 56, 58, 42, 40, 42, 58, 60] as const; // lifted

export const moodRadii = (v: number): Radii =>
  LO.map((a, i) => Math.round(a + (HI[i] - a) * (v / 100))) as unknown as Radii;
