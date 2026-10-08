import type { Entry } from './types';

export const COPY = {
  emptySave: 'Add a word, a photo, anything',
  emptyBody: 'No words, just moments.',
  writePlaceholder: 'Start anywhere. One word is enough.',
  publicHeadsUp: 'This page will be public once saved',
} as const;

export function saveToast(d: Entry, today: string): string {
  const base = d.date === today ? 'Saved to today’s page' : 'Saved';
  return base + (d.vis === 'public' ? ' · public' : d.vis === 'friends' ? ' · shared with friends' : '');
}
