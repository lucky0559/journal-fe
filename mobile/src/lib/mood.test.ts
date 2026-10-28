import { MOODS, MOOD_COLORS, moodColorAt, moodIndex, moodColor, moodRotation, moodRadii } from './mood';

describe('mood', () => {
  it('buckets 0-100 into five labels', () => {
    expect([0, 19, 20, 39, 40, 59, 60, 79, 80, 100].map(moodIndex)).toEqual([0, 0, 0, 1, 1, 2, 2, 3, 3, 4]);
    expect(MOODS.map(([l]) => l)).toEqual(['Heavy', 'Low', 'Okay', 'Good', 'Bright']);
    expect(MOODS[2][1]).toBe('Somewhere in the middle');
    expect(MOODS[4][1]).toBe('Let’s catch this one');
  });

  it('maps mood 0 to dusk violet and 100 to lamp amber', () => {
    expect(moodColor(0)).toBe('#7a77ba');
    expect(moodColor(100)).toBe('#f8ac3d');
  });

  it('passes through rose between the two, so the middle of the scale is warm and not muddy', () => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(moodColor(50).slice(i, i + 2), 16));
    expect(r).toBeGreaterThan(g); // red leads green: pink, not olive or grey
    expect(r).toBeGreaterThan(b);
  });

  it('has a lookup colour for every whole mood, matching moodColor', () => {
    expect(MOOD_COLORS).toHaveLength(101);
    expect(MOOD_COLORS[37]).toBe(moodColor(37));
    expect(moodColorAt(37.4)).toBe(moodColor(37));
    expect(moodColorAt(-5)).toBe(moodColor(0));
    expect(moodColorAt(250)).toBe(moodColor(100));
  });

  it('rotates from -12deg to +12deg', () => {
    expect(moodRotation(0)).toBe(-12);
    expect(moodRotation(50)).toBe(0);
    expect(moodRotation(100)).toBe(12);
  });

  it('interpolates blob radii between the droopy and lifted shapes', () => {
    expect(moodRadii(0)).toEqual([62, 38, 34, 66, 70, 44, 56, 30]);
    expect(moodRadii(100)).toEqual([44, 56, 58, 42, 40, 42, 58, 60]);
  });
});
