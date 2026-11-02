import { addDays } from './dates';

interface Dated { date: string; mood: number }
export interface DayDot { iso: string; mood: number | null }

/** The last `days` days ending today, oldest first: each day's average mood, or null for a day without a page. */
export function recentDays(entries: Dated[], today: string, days = 28): DayDot[] {
  const moods = new Map<string, number[]>();
  for (const e of entries) moods.set(e.date, [...(moods.get(e.date) ?? []), e.mood]);
  return Array.from({ length: days }, (_, i) => {
    const iso = addDays(today, i - (days - 1));
    const list = moods.get(iso);
    return { iso, mood: list ? list.reduce((a, b) => a + b, 0) / list.length : null };
  });
}

/** How many pages were written in the same month as `today`. */
export const pagesInMonth = (entries: Dated[], today: string): number => entries.filter((e) => e.date.slice(0, 7) === today.slice(0, 7)).length;
