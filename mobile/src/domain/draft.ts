import { fmtTime, todayIso } from '@/lib/dates';
import type { Entry, Photo, Visibility, Voice } from './types';

export function newDraft(o: { id: string; now: Date; mood: number; feelings?: string[]; date?: string; prompt?: string }): Entry {
  return {
    id: o.id, createdAt: o.now.getTime(), date: o.date ?? todayIso(o.now), time: fmtTime(o.now), mood: o.mood,
    feelings: [...(o.feelings ?? [])], text: '', prompt: o.prompt ?? '', vis: 'private', photos: [], voices: [], stickers: [],
  };
}

export const editDraft = (e: Entry): Entry => ({
  ...e, feelings: [...e.feelings], photos: [...e.photos], voices: [...e.voices], stickers: [...e.stickers],
});

export type DraftAction =
  | { type: 'text'; value: string }
  | { type: 'mood'; value: number }
  | { type: 'vis'; value: Visibility }
  | { type: 'clearPrompt' }
  | { type: 'addPhoto'; photo: Photo }
  | { type: 'removePhoto'; id: string }
  | { type: 'addVoice'; voice: Voice }
  | { type: 'removeVoice'; id: string }
  | { type: 'addSticker'; name: string }
  | { type: 'removeSticker'; index: number };

export function draftReducer(d: Entry, a: DraftAction): Entry {
  switch (a.type) {
    case 'text': return { ...d, text: a.value };
    case 'mood': return { ...d, mood: a.value };
    case 'vis': return { ...d, vis: a.value };
    case 'clearPrompt': return { ...d, prompt: '' };
    case 'addPhoto': return { ...d, photos: [...d.photos, a.photo] };
    case 'removePhoto': return { ...d, photos: d.photos.filter((p) => p.id !== a.id) };
    case 'addVoice': return { ...d, voices: [...d.voices, a.voice] };
    case 'removeVoice': return { ...d, voices: d.voices.filter((v) => v.id !== a.id) };
    case 'addSticker': return { ...d, stickers: [...d.stickers, a.name] };
    case 'removeSticker': return { ...d, stickers: d.stickers.filter((_, i) => i !== a.index) };
  }
}

export const hasContent = (d: Entry): boolean =>
  d.text.trim().length > 0 || d.photos.length > 0 || d.voices.length > 0 || d.stickers.length > 0;

const editable = (d: Entry) =>
  JSON.stringify([d.text, d.mood, d.vis, d.prompt, d.photos, d.voices, d.stickers]);
export const isDirty = (current: Entry, original: Entry): boolean => editable(current) !== editable(original);

export function defaultDateForNewPage(o: {
  route: 'today' | 'timeline'; mode: 'cal' | 'list'; selDay: string; today: string; selDayHasEntries: boolean;
}): string {
  return o.route === 'timeline' && o.mode === 'cal' && o.selDay <= o.today && !o.selDayHasEntries ? o.selDay : o.today;
}

const uris = (e: Entry | null): string[] =>
  e ? [...e.photos.map((p) => p.uri), ...e.voices.map((v) => v.uri)].filter(Boolean) : [];

/** Files created in this editing session: delete them if the user discards the page. */
export const addedUris = (original: Entry | null, current: Entry): string[] => {
  const before = new Set(uris(original));
  return uris(current).filter((u) => !before.has(u));
};

/** Files an existing page no longer references after saving: delete them. */
export const orphanedUris = (original: Entry | null, saved: Entry): string[] => {
  const after = new Set(uris(saved));
  return uris(original).filter((u) => !after.has(u));
};
