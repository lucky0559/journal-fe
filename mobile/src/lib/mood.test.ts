import { MOODS, MOOD_COLORS, moodColorAt, moodIndex, moodColor, moodRotation, moodRadii } from './mood';

describe('mood', () => {
  it('buckets 0-100 into five labels', () => {
    expect([0, 19, 20, 39, 40, 59, 60, 79, 80, 100].map(moodIndex)).toEqual([0, 0, 0, 1, 1, 2, 2, 3, 3, 4]);
    expect(MOODS.map(([l]) => l)).toEqual(['Heavy', 'Low', 'Okay', 'Good', 'Bright']);
    expect(MOODS[2][1]).toBe('Somewhere in the middle');
    expect(MOODS[4][1]).toBe('Let’s catch this one');
  });

  it('maps mood 0 to sage-600 and 100 to accent-500', () => {
    expect(moodColor(0)).toBe('#728157');
    expect(moodColor(100)).toBe('#d67f48');
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
