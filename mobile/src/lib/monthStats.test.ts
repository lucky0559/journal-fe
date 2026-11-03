import { monthStats } from './monthStats';

const page = (date: string, mood: number) => ({ date, mood });

describe('monthStats', () => {
  it('counts pages and the days they were written on in the month (month is 0-based)', () => {
    const list = [page('2026-10-01', 40), page('2026-10-08', 60), page('2026-10-08', 80), page('2026-09-30', 10), page('2025-10-08', 10)];
    expect(monthStats(list, 2026, 9)).toEqual({ pages: 3, days: 2, mood: 60 });
  });

  it('has no mood for an empty month', () => {
    expect(monthStats([page('2026-10-01', 40)], 2026, 0)).toEqual({ pages: 0, days: 0, mood: null });
  });

  it('pads single-digit months', () => {
    expect(monthStats([page('2026-02-03', 50)], 2026, 1).pages).toBe(1);
  });
});
