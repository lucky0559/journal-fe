interface Dated { date: string; mood: number }

/** Pages written in a month (`month` is 0-based, as in the Timeline), how many days had one, and the average mood (null with none). */
export function monthStats(entries: Dated[], year: number, month: number): { pages: number; days: number; mood: number | null } {
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  const inMonth = entries.filter((e) => e.date.slice(0, 7) === prefix);
  return {
    pages: inMonth.length,
    days: new Set(inMonth.map((e) => e.date)).size,
    mood: inMonth.length ? inMonth.reduce((a, e) => a + e.mood, 0) / inMonth.length : null,
  };
}
