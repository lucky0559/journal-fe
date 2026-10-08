import type { Entry } from '@/domain/types';
import { MONTHS } from '@/lib/dates';

export function groupByMonth(entries: Entry[]): { title: string; entries: Entry[] }[] {
  const out: { title: string; entries: Entry[] }[] = [];
  for (const e of entries) {
    const title = `${MONTHS[+e.date.slice(5, 7) - 1]} ${e.date.slice(0, 4)}`;
    const last = out[out.length - 1];
    if (last && last.title === title) last.entries.push(e);
    else out.push({ title, entries: [e] });
  }
  return out;
}
