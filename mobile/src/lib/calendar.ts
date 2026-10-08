import type { Entry } from '@/domain/types';

export interface DayCell {
  day: number; iso: string; future: boolean; today: boolean; count: number; avgMood: number | null;
}

const pad = (n: number) => String(n).padStart(2, '0');

export function monthGrid(
  year: number, month: number, today: string, entries: Pick<Entry, 'date' | 'mood'>[],
): { offset: number; days: DayCell[] } {
  const offset = (new Date(year, month, 1).getDay() + 6) % 7;
  const dim = new Date(year, month + 1, 0).getDate();
  const byDate = new Map<string, number[]>();
  for (const e of entries) byDate.set(e.date, [...(byDate.get(e.date) ?? []), e.mood]);
  const days: DayCell[] = [];
  for (let day = 1; day <= dim; day++) {
    const iso = `${year}-${pad(month + 1)}-${pad(day)}`;
    const moods = byDate.get(iso) ?? [];
    days.push({
      day, iso, future: iso > today, today: iso === today, count: moods.length,
      avgMood: moods.length ? moods.reduce((a, b) => a + b, 0) / moods.length : null,
    });
  }
  return { offset, days };
}

export function shiftMonth(year: number, month: number, delta: 1 | -1): { year: number; month: number } {
  const m = month + delta;
  if (m < 0) return { year: year - 1, month: 11 };
  if (m > 11) return { year: year + 1, month: 0 };
  return { year, month: m };
}
