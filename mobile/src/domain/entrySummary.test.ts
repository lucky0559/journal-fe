import type { Entry } from './types';
import { summarizeEntry } from './entrySummary';
import { VIS, VIS_ORDER, VIS_FOOTNOTE } from './visibility';

const e = (over: Partial<Entry>): Entry => ({
  id: 'a', createdAt: 1, date: '2026-10-03', time: '6:12 pm', mood: 84, feelings: [], text: 'Found a bench.',
  prompt: '', vis: 'public', photos: [], voices: [], stickers: [], ...over,
});

describe('summarizeEntry', () => {
  it('builds the meta line from photos, voice and stickers', () => {
    const s = summarizeEntry(e({
      photos: [{ id: '1', uri: '' }, { id: '2', uri: '' }],
      voices: [{ id: 'v', uri: '', seconds: 38 }], stickers: ['cozy'],
    }));
    expect(s.meta).toBe('2 photos · voice 0:38 · cozy');
  });
  it('singularises one photo and joins several stickers', () => {
    expect(summarizeEntry(e({ photos: [{ id: '1', uri: '' }] })).meta).toBe('1 photo');
    expect(summarizeEntry(e({ stickers: ['calm', 'proud'] })).meta).toBe('calm, proud');
  });
  it('shows "No words, just moments." for a page without text', () => {
    expect(summarizeEntry(e({ text: '', stickers: ['calm'] })).text).toBe('No words, just moments.');
    expect(summarizeEntry(e({ text: '   ', stickers: ['calm'] })).text).toBe('No words, just moments.');
  });
  it('labels date, mood and visibility', () => {
    const s = summarizeEntry(e({}));
    expect(s).toMatchObject({ dateLabel: 'Sat, 3 Oct', time: '6:12 pm', moodLabel: 'Bright', visLabel: 'Public' });
    expect(summarizeEntry(e({ vis: 'private' })).visLabel).toBe('');
    expect(summarizeEntry(e({ vis: 'friends' })).visLabel).toBe('Friends');
  });
  it('exposes the three visibility options with their copy', () => {
    expect(VIS_ORDER).toEqual(['private', 'friends', 'public']);
    expect(VIS.private.desc).toBe('Stays on this phone, behind your lock.');
    expect(VIS.friends.desc).toBe('People you’ve added can read it in their feed.');
    expect(VIS.public.desc).toBe('Anyone with your profile link can read it, photos and voice notes included.');
    expect(VIS_FOOTNOTE).toBe('Mood and feelings stay private either way. You can change this anytime.');
  });
});
