import type { Entry } from '@/domain/types';
import { fmtLong } from '@/lib/dates';
import { moodIndex } from '@/lib/mood';

/**
 * The pages that match what was typed (words from the page, its prompt, its feelings or its date, every word of the
 * search has to be found) and, when one is chosen, a mood level 0-4. Order is kept, so newest stays first.
 */
export function filterPages(entries: Entry[], query: string, mood: number | null): Entry[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  return entries.filter((e) => {
    if (mood !== null && moodIndex(e.mood) !== mood) return false;
    if (!words.length) return true;
    const haystack = [e.text, e.prompt, e.feelings.join(' '), fmtLong(e.date), e.date].join(' ').toLowerCase();
    return words.every((w) => haystack.includes(w));
  });
}
