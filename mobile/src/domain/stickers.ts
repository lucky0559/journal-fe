import { ramp } from '@/theme/tokens';
import { parseRadii, type Radii } from '@/lib/blob';

export const STICKERS = [
  { name: 'calm', bg: ramp.accent2[300], ink: ramp.accent2[900] },
  { name: 'cozy', bg: ramp.accent[200], ink: ramp.accent[900] },
  { name: 'proud', bg: ramp.accent[400], ink: ramp.accent[900] },
  { name: 'tired', bg: ramp.neutral[300], ink: ramp.neutral[900] },
  { name: 'grateful', bg: ramp.accent2[200], ink: ramp.accent2[900] },
  { name: 'rainy', bg: ramp.neutral[200], ink: ramp.neutral[800] },
  { name: 'brave', bg: ramp.accent[300], ink: ramp.accent[900] },
  { name: 'meh', bg: ramp.neutral[400], ink: ramp.neutral[900] },
] as const;

const BLOBS = [
  '50%',
  '58% 42% 38% 62% / 64% 46% 54% 36%',
  '40% 60% 60% 40% / 42% 44% 56% 58%',
  '46% 54% 50% 50% / 50% 46% 54% 50%',
].map(parseRadii);

const hash = (s: string) => [...s].reduce((a, c) => a + c.charCodeAt(0), 0);

export const blobFor = (name: string): Radii => BLOBS[hash(name) % 4];
export const tiltFor = (name: string): number => ((hash(name) % 3) - 1) * 6;
export const stickerStyle = (name: string) => STICKERS.find((s) => s.name === name) ?? STICKERS[0];
