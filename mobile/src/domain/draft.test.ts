import type { Entry } from './types';
import {
  newDraft, editDraft, draftReducer, hasContent, isDirty, defaultDateForNewPage, addedUris, orphanedUris,
} from './draft';
import { saveToast, COPY } from './copy';
import { STICKERS, blobFor, tiltFor } from './stickers';
import { PROMPTS, promptFor } from './prompts';

const now = new Date(2026, 9, 8, 21, 41);
const base = () => newDraft({ id: 'd1', now, mood: 62 });

describe('newDraft', () => {
  it('starts private, empty, stamped with the current date and time', () => {
    expect(base()).toEqual({
      id: 'd1', createdAt: now.getTime(), date: '2026-10-08', time: '9:41 pm', mood: 62, feelings: [], text: '',
      prompt: '', vis: 'private', photos: [], voices: [], stickers: [],
    });
  });
  it('accepts a prompt, a back-dated day and carried-over feelings', () => {
    const d = newDraft({ id: 'd', now, mood: 30, date: '2026-10-03', prompt: 'Hi?', feelings: ['tired'] });
    expect(d).toMatchObject({ date: '2026-10-03', prompt: 'Hi?', feelings: ['tired'], mood: 30 });
  });
});

describe('draftReducer', () => {
  it('edits text, mood, visibility and prompt', () => {
    let d = base();
    d = draftReducer(d, { type: 'text', value: 'hello' });
    d = draftReducer(d, { type: 'mood', value: 10 });
    d = draftReducer(d, { type: 'vis', value: 'friends' });
    expect(d).toMatchObject({ text: 'hello', mood: 10, vis: 'friends' });
    d = { ...d, prompt: 'p' };
    expect(draftReducer(d, { type: 'clearPrompt' }).prompt).toBe('');
  });

  it('adds and removes photos, voices and stickers', () => {
    let d = base();
    d = draftReducer(d, { type: 'addPhoto', photo: { id: 'p1', uri: 'file:///1.jpg' } });
    d = draftReducer(d, { type: 'addPhoto', photo: { id: 'p2', uri: 'file:///2.jpg' } });
    d = draftReducer(d, { type: 'addVoice', voice: { id: 'v1', uri: 'file:///v.m4a', seconds: 7 } });
    d = draftReducer(d, { type: 'addSticker', name: 'calm' });
    d = draftReducer(d, { type: 'addSticker', name: 'calm' });
    expect(d.photos).toHaveLength(2);
    expect(d.stickers).toEqual(['calm', 'calm']);
    d = draftReducer(d, { type: 'removePhoto', id: 'p1' });
    d = draftReducer(d, { type: 'removeVoice', id: 'v1' });
    d = draftReducer(d, { type: 'removeSticker', index: 0 });
    expect(d.photos.map((p) => p.id)).toEqual(['p2']);
    expect(d.voices).toEqual([]);
    expect(d.stickers).toEqual(['calm']);
  });

  it('never mutates the previous draft', () => {
    const d = base();
    const next = draftReducer(d, { type: 'addSticker', name: 'cozy' });
    expect(d.stickers).toEqual([]);
    expect(next).not.toBe(d);
  });
});

describe('hasContent', () => {
  it('rejects empty and whitespace-only pages', () => {
    expect(hasContent(base())).toBe(false);
    expect(hasContent({ ...base(), text: '   \n\t ' })).toBe(false);
  });
  it('accepts words, or any single kind of media', () => {
    expect(hasContent({ ...base(), text: 'a' })).toBe(true);
    expect(hasContent({ ...base(), stickers: ['calm'] })).toBe(true);
    expect(hasContent({ ...base(), voices: [{ id: 'v', uri: '', seconds: 1 }] })).toBe(true);
    expect(hasContent({ ...base(), photos: [{ id: 'p', uri: '' }] })).toBe(true);
  });
  it('does not count a prompt or mood alone as content', () => {
    expect(hasContent({ ...base(), prompt: 'Who?', mood: 99 })).toBe(false);
  });
});

describe('isDirty', () => {
  it('is false for an untouched draft and true after any edit', () => {
    const d = base();
    expect(isDirty(d, d)).toBe(false);
    expect(isDirty(draftReducer(d, { type: 'text', value: 'x' }), d)).toBe(true);
    expect(isDirty(draftReducer(d, { type: 'mood', value: 1 }), d)).toBe(true);
  });
  it('is false after editing back to the original text', () => {
    const d = base();
    const edited = draftReducer(draftReducer(d, { type: 'text', value: 'x' }), { type: 'text', value: '' });
    expect(isDirty(edited, d)).toBe(false);
  });
});

describe('editDraft', () => {
  it('copies arrays so edits cannot leak into the stored entry', () => {
    const e: Entry = { ...base(), stickers: ['calm'] };
    const d = editDraft(e);
    d.stickers.push('x');
    expect(e.stickers).toEqual(['calm']);
  });
});

describe('defaultDateForNewPage', () => {
  const o = { route: 'timeline' as const, mode: 'cal' as const, selDay: '2026-10-03', today: '2026-10-08', selDayHasEntries: false };
  it('uses the selected empty past day on the calendar', () => {
    expect(defaultDateForNewPage(o)).toBe('2026-10-03');
  });
  it('falls back to today otherwise', () => {
    expect(defaultDateForNewPage({ ...o, route: 'today' })).toBe('2026-10-08');
    expect(defaultDateForNewPage({ ...o, mode: 'list' })).toBe('2026-10-08');
    expect(defaultDateForNewPage({ ...o, selDayHasEntries: true })).toBe('2026-10-08');
    expect(defaultDateForNewPage({ ...o, selDay: '2026-10-20' })).toBe('2026-10-08');
  });
});

describe('media bookkeeping', () => {
  const original: Entry = {
    ...base(), photos: [{ id: 'a', uri: 'file:///a.jpg' }], voices: [{ id: 'v', uri: 'file:///v.m4a', seconds: 3 }],
  };
  it('lists uris added during an editing session (to delete on discard)', () => {
    const current = draftReducer(original, { type: 'addPhoto', photo: { id: 'b', uri: 'file:///b.jpg' } });
    expect(addedUris(original, current)).toEqual(['file:///b.jpg']);
    expect(addedUris(null, current).sort()).toEqual(['file:///a.jpg', 'file:///b.jpg', 'file:///v.m4a']);
  });
  it('lists uris removed from an existing page (to delete on save)', () => {
    const saved = draftReducer(original, { type: 'removePhoto', id: 'a' });
    expect(orphanedUris(original, saved)).toEqual(['file:///a.jpg']);
    expect(orphanedUris(null, saved)).toEqual([]);
  });
  it('ignores placeholder media with an empty uri', () => {
    const seeded = { ...original, photos: [{ id: 'x', uri: '', label: 'photo · river' }] };
    expect(addedUris(null, seeded)).not.toContain('');
  });
});

describe('saveToast', () => {
  const d = base();
  it('names today’s page and the audience', () => {
    expect(saveToast(d, '2026-10-08')).toBe('Saved to today’s page');
    expect(saveToast({ ...d, vis: 'friends' }, '2026-10-08')).toBe('Saved to today’s page · shared with friends');
    expect(saveToast({ ...d, vis: 'public' }, '2026-10-08')).toBe('Saved to today’s page · public');
  });
  it('uses a plain message for other days', () => {
    expect(saveToast({ ...d, date: '2026-10-03' }, '2026-10-08')).toBe('Saved');
    expect(saveToast({ ...d, date: '2026-10-03', vis: 'public' }, '2026-10-08')).toBe('Saved · public');
  });
  it('has the exact empty-save copy', () => {
    expect(COPY.emptySave).toBe('Add a word, a photo, anything');
  });
});

describe('stickers and prompts', () => {
  it('has the eight stickers in order', () => {
    expect(STICKERS.map((s) => s.name)).toEqual(['calm', 'cozy', 'proud', 'tired', 'grateful', 'rainy', 'brave', 'meh']);
  });
  it('gives each sticker a stable blob and tilt', () => {
    expect(blobFor('calm')).toEqual(blobFor('calm'));
    expect([-6, 0, 6]).toContain(tiltFor('calm'));
    expect(tiltFor('calm')).toBe(tiltFor('calm'));
  });
  it('offsets the prompt order by mood bucket and wraps', () => {
    expect(PROMPTS).toHaveLength(6);
    expect(promptFor(0, 0)).toBe(PROMPTS[0]);
    expect(promptFor(0, 2)).toBe(PROMPTS[2]);
    expect(promptFor(5, 2)).toBe(PROMPTS[1]);
  });
});
