import { ramp } from '@/theme/tokens';
import { PROMPTS } from '@/domain/prompts';
import { deckCards, behindTransform, shiftFor, SWIPE_THRESHOLD, FLY_DISTANCE } from './deck';

describe('deckCards', () => {
  it('returns three cards in paint order with the top card last', () => {
    const cards = deckCards(0, 2);
    expect(cards.map((c) => c.depth)).toEqual([2, 1, 0]);
    expect(cards[2]).toMatchObject({
      n: 0, text: PROMPTS[2], bg: ramp.accent[200], ink: ramp.accent[900], kicker: 'For an okay day', counter: '1 / 6',
    });
    expect(cards[1]).toMatchObject({ n: 1, bg: ramp.accent2[200], ink: ramp.accent2[900] });
    expect(cards[0]).toMatchObject({ n: 2, bg: ramp.neutral[200], ink: ramp.neutral[900] });
  });

  it('can also build a hidden spare card behind the visible three', () => {
    const cards = deckCards(2, 1, 4);
    expect(cards.map((c) => c.depth)).toEqual([3, 2, 1, 0]);
    expect(cards.map((c) => c.n)).toEqual([5, 4, 3, 2]); // the top card is n = deck index
  });

  it('cycles colours and the counter as the deck advances', () => {
    expect(deckCards(3, 0)[2]).toMatchObject({ bg: ramp.accent[200], counter: '4 / 6' });
    expect(deckCards(6, 0)[2].counter).toBe('1 / 6');
  });

  it('uses the right article in the kicker', () => {
    expect(deckCards(0, 0)[2].kicker).toBe('For a heavy day');
    expect(deckCards(0, 4)[2].kicker).toBe('For a bright day');
    expect(deckCards(0, 2)[2].kicker).toBe('For an okay day');
  });

  it('offsets the prompt order by the mood bucket', () => {
    expect(deckCards(0, 0)[2].text).toBe(PROMPTS[0]);
    expect(deckCards(0, 3)[2].text).toBe(PROMPTS[3]);
  });
});

describe('deck motion', () => {
  it('stacks cards behind the top one and lifts them as the top card is dragged away', () => {
    expect(behindTransform(1, 0)).toEqual({ translateY: 14, scale: 0.95 });
    expect(behindTransform(2, 0)).toEqual({ translateY: 28, scale: 0.9 });
    expect(behindTransform(1, 1)).toEqual({ translateY: 0, scale: 1 });
    expect(behindTransform(2, 1)).toEqual({ translateY: 14, scale: 0.95 });
  });
  it('maps drag distance to a 0..1 shift', () => {
    expect(shiftFor(0)).toBe(0);
    expect(shiftFor(-60)).toBe(0.5);
    expect(shiftFor(400)).toBe(1);
  });
  it('has the spec thresholds', () => {
    expect(SWIPE_THRESHOLD).toBe(90);
    expect(FLY_DISTANCE).toBe(460);
  });
});
