import { toIso, todayIso, addDays, fmtShort, fmtLong, fmtTime, secs, greeting, MONTHS } from './dates';

describe('dates', () => {
  it('formats iso dates', () => {
    expect(fmtShort('2026-10-08')).toBe('Thu, 8 Oct');
    expect(fmtLong('2026-10-08')).toBe('Thursday, 8 October');
    expect(fmtShort('2026-01-01')).toBe('Thu, 1 Jan');
  });

  it('formats clock time as 12-hour lowercase', () => {
    expect(fmtTime(new Date(2026, 9, 8, 21, 41))).toBe('9:41 pm');
    expect(fmtTime(new Date(2026, 9, 8, 0, 5))).toBe('12:05 am');
    expect(fmtTime(new Date(2026, 9, 8, 12, 0))).toBe('12:00 pm');
    expect(fmtTime(new Date(2026, 9, 8, 13, 4))).toBe('1:04 pm');
  });

  it('formats voice durations', () => {
    expect(secs(38)).toBe('0:38');
    expect(secs(7)).toBe('0:07');
    expect(secs(125)).toBe('2:05');
  });

  it('adds days across month and year boundaries', () => {
    expect(addDays('2026-10-08', -1)).toBe('2026-10-07');
    expect(addDays('2026-10-01', -1)).toBe('2026-09-30');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
  });

  it('builds today’s iso from a Date using local time', () => {
    expect(todayIso(new Date(2026, 9, 8, 23, 59))).toBe('2026-10-08');
    expect(toIso(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('greets by hour (small hours still count as the same evening)', () => {
    expect([3, 5, 11, 12, 17, 18, 23].map(greeting)).toEqual([
      'Good evening', 'Good morning', 'Good morning', 'Good afternoon', 'Good afternoon', 'Good evening', 'Good evening',
    ]);
  });

  it('lists month names', () => {
    expect(MONTHS[0]).toBe('January');
    expect(MONTHS).toHaveLength(12);
  });
});
