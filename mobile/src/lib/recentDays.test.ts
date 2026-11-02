import { pagesInMonth, recentDays } from './recentDays';

const page = (date: string, mood: number) => ({ date, mood });

describe('recentDays', () => {
  it('lists the last days ending today, oldest first, with no mood for a day without a page', () => {
    const days = recentDays([], '2026-10-08', 5);
    expect(days.map((d) => d.iso)).toEqual(['2026-10-04', '2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08']);
    expect(days.every((d) => d.mood === null)).toBe(true);
  });

  it('gives each day the average mood of its pages', () => {
    const days = recentDays([page('2026-10-07', 20), page('2026-10-07', 60), page('2026-10-08', 90)], '2026-10-08', 3);
    expect(days.map((d) => d.mood)).toEqual([null, 40, 90]);
  });

  it('ignores pages outside the window, including ones in the future', () => {
    const days = recentDays([page('2026-09-01', 10), page('2026-10-09', 99)], '2026-10-08', 3);
    expect(days.every((d) => d.mood === null)).toBe(true);
  });

  it('crosses a month boundary', () => {
    expect(recentDays([], '2026-11-02', 4).map((d) => d.iso)).toEqual(['2026-10-30', '2026-10-31', '2026-11-01', '2026-11-02']);
  });
});

describe('pagesInMonth', () => {
  it('counts the pages written in the same month as today', () => {
    const list = [page('2026-10-01', 50), page('2026-10-08', 50), page('2026-10-08', 70), page('2026-09-30', 50), page('2025-10-08', 50)];
    expect(pagesInMonth(list, '2026-10-08')).toBe(3);
  });

  it('is zero when there are none', () => {
    expect(pagesInMonth([], '2026-10-08')).toBe(0);
  });
});
