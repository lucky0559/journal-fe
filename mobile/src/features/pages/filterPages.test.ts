import type { Entry } from '@/domain/types';
import { filterPages } from './filterPages';

const e = (id: string, over: Partial<Entry> = {}): Entry => ({
  id, createdAt: 0, date: '2026-10-08', time: '9:41 pm', mood: 50, feelings: [], text: '', prompt: '', vis: 'private',
  photos: [], voices: [], stickers: [], publishedAt: null, ...over,
});

const pages = [
  e('a', { text: 'Made pasta with Jun', mood: 70, feelings: ['grateful'] }),
  e('b', { text: 'Long quiet day', mood: 10, date: '2026-09-02' }),
  e('c', { text: 'Rainy walk', prompt: 'Who did you feel close to today?', mood: 50 }),
];

describe('filterPages', () => {
  it('keeps every page, in order, when nothing is asked', () => {
    expect(filterPages(pages, '', null).map((p) => p.id)).toEqual(['a', 'b', 'c']);
    expect(filterPages(pages, '   ', null)).toHaveLength(3);
  });
  it('finds words in the text, the prompt and the feelings, ignoring case', () => {
    expect(filterPages(pages, 'PASTA', null).map((p) => p.id)).toEqual(['a']);
    expect(filterPages(pages, 'feel close', null).map((p) => p.id)).toEqual(['c']);
    expect(filterPages(pages, 'grateful', null).map((p) => p.id)).toEqual(['a']);
  });
  it('needs every word, in any order', () => {
    expect(filterPages(pages, 'quiet long', null).map((p) => p.id)).toEqual(['b']);
    expect(filterPages(pages, 'quiet pasta', null)).toEqual([]);
  });
  it('finds a page by its date', () => {
    expect(filterPages(pages, '2026-09', null).map((p) => p.id)).toEqual(['b']);
  });
  it('narrows to one mood level', () => {
    expect(filterPages(pages, '', 0).map((p) => p.id)).toEqual(['b']);
    expect(filterPages(pages, '', 3).map((p) => p.id)).toEqual(['a']);
    expect(filterPages(pages, 'pasta', 0)).toEqual([]);
  });
});
