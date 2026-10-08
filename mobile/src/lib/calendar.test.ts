import { monthGrid, shiftMonth } from './calendar';

const e = (date: string, mood: number) => ({ date, mood });

describe('monthGrid', () => {
  it('uses a Monday-first offset (Oct 2026 starts on Thursday)', () => {
    const g = monthGrid(2026, 9, '2026-10-08', []);
    expect(g.offset).toBe(3);
    expect(g.days).toHaveLength(31);
  });

  it('handles a month that starts on Sunday (offset 6) and a 30-day month', () => {
    const g = monthGrid(2026, 10, '2026-10-08', []);
    expect(g.offset).toBe(6);
    expect(g.days).toHaveLength(30);
  });

  it('handles Feb in a leap year and a non-leap year', () => {
    expect(monthGrid(2028, 1, '2028-02-10', []).days).toHaveLength(29);
    expect(monthGrid(2028, 1, '2028-02-10', []).offset).toBe(1);
    expect(monthGrid(2027, 1, '2027-02-10', []).days).toHaveLength(28);
    expect(monthGrid(2027, 1, '2027-02-10', []).offset).toBe(0);
  });

  it('flags today and disables future days', () => {
    const { days } = monthGrid(2026, 9, '2026-10-08', []);
    expect(days[7]).toMatchObject({ day: 8, today: true, future: false });
    expect(days[8]).toMatchObject({ day: 9, today: false, future: true });
  });

  it('averages the mood of several entries on one day', () => {
    const { days } = monthGrid(2026, 9, '2026-10-08', [e('2026-10-07', 40), e('2026-10-07', 80), e('2026-10-06', 28)]);
    expect(days[6]).toMatchObject({ count: 2, avgMood: 60 });
    expect(days[5]).toMatchObject({ count: 1, avgMood: 28 });
    expect(days[0]).toMatchObject({ count: 0, avgMood: null });
  });

  it('ignores entries from other months', () => {
    const { days } = monthGrid(2026, 9, '2026-10-08', [e('2026-09-28', 18)]);
    expect(days.every((d) => d.count === 0)).toBe(true);
  });
});

describe('shiftMonth', () => {
  it('wraps December to January and back', () => {
    expect(shiftMonth(2026, 11, 1)).toEqual({ year: 2027, month: 0 });
    expect(shiftMonth(2026, 0, -1)).toEqual({ year: 2025, month: 11 });
    expect(shiftMonth(2026, 9, -1)).toEqual({ year: 2026, month: 8 });
  });
});
