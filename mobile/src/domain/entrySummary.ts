import { fmtShort, secs } from '@/lib/dates';
import { MOODS, moodColor, moodIndex } from '@/lib/mood';
import { COPY } from './copy';
import type { Entry } from './types';
import { VIS } from './visibility';

export function summarizeEntry(e: Entry) {
  const parts: string[] = [];
  if (e.photos.length) parts.push(`${e.photos.length} ${e.photos.length > 1 ? 'photos' : 'photo'}`);
  e.voices.forEach((v) => parts.push(`voice ${secs(v.seconds)}`));
  if (e.stickers.length) parts.push(e.stickers.join(', '));
  return {
    color: moodColor(e.mood),
    dateLabel: fmtShort(e.date),
    time: e.time,
    moodLabel: MOODS[moodIndex(e.mood)][0],
    text: e.text.trim() ? e.text : COPY.emptyBody,
    meta: parts.join(' · '),
    visLabel: e.vis === 'private' ? '' : VIS[e.vis].label,
    visBg: VIS[e.vis].iconBg,
    visFg: VIS[e.vis].fg,
  };
}
