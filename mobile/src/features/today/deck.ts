import { promptFor } from '@/domain/prompts';
import { MOODS } from '@/lib/mood';
import { ramp } from '@/theme/tokens';

export const SWIPE_THRESHOLD = 90;
export const FLY_DISTANCE = 460;
export const SHIFT_DISTANCE = 120;
export const FEELINGS = ['grateful', 'tired', 'anxious', 'proud', 'lonely', 'calm'];

const COLORS = [
  [ramp.accent[200], ramp.accent[900]],
  [ramp.accent2[200], ramp.accent2[900]],
  [ramp.neutral[200], ramp.neutral[900]],
] as const;

export interface DeckCard { n: number; depth: 0 | 1 | 2; bg: string; ink: string; text: string; kicker: string; counter: string }

const article = (w: string) => (/^[aeiou]/i.test(w) ? 'an' : 'a');

export function deckCards(deckIdx: number, moodIdx: number): DeckCard[] {
  const word = MOODS[moodIdx][0].toLowerCase();
  return ([2, 1, 0] as const).map((depth) => {
    const n = deckIdx + depth;
    return {
      n, depth, bg: COLORS[n % 3][0], ink: COLORS[n % 3][1], text: promptFor(n, moodIdx),
      kicker: `For ${article(word)} ${word} day`, counter: `${(n % 6) + 1} / 6`,
    };
  });
}

export const shiftFor = (dx: number): number => Math.min(1, Math.abs(dx) / SHIFT_DISTANCE);

export function behindTransform(depth: 1 | 2, shift: number): { translateY: number; scale: number } {
  const d = depth - shift;
  return { translateY: d * 14, scale: 1 - d * 0.05 };
}
