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

export interface DeckCard { n: number; depth: number; bg: string; ink: string; text: string; kicker: string; counter: string }

const article = (w: string) => (/^[aeiou]/i.test(w) ? 'an' : 'a');

/** Cards in paint order (deepest first, top card last). `count` > 3 also builds hidden spares behind the visible three. */
export function deckCards(deckIdx: number, moodIdx: number, count = 3): DeckCard[] {
  const word = MOODS[moodIdx][0].toLowerCase();
  return Array.from({ length: count }, (_, i) => count - 1 - i).map((depth) => {
    const n = deckIdx + depth;
    return {
      n, depth, bg: COLORS[n % 3][0], ink: COLORS[n % 3][1], text: promptFor(n, moodIdx),
      kicker: `For ${article(word)} ${word} day`, counter: `${(n % 6) + 1} / 6`,
    };
  });
}

// Worklets: the deck animates on the UI thread.
export const shiftFor = (dx: number): number => {
  'worklet';
  return Math.min(1, Math.abs(dx) / SHIFT_DISTANCE);
};

export function behindTransform(depth: number, shift: number): { translateY: number; scale: number } {
  'worklet';
  const d = depth - shift;
  return { translateY: d * 14, scale: 1 - d * 0.05 };
}
