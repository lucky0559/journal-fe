import type { Entry } from '@/domain/types';
import { pagePosition, ruledLineCount } from './pageNav';

const e = (id: string): Entry => ({
  id, createdAt: 1, date: '2026-10-08', time: '9:00 pm', mood: 50, feelings: [], text: id, prompt: '', vis: 'private',
  photos: [], voices: [], stickers: [], publishedAt: null,
});
const journal = [e('c'), e('b'), e('a')]; // newest first

describe('pagePosition', () => {
  it('finds the older and newer neighbours and counts from the first page', () => {
    expect(pagePosition(journal, 'b')).toMatchObject({ older: { id: 'a' }, newer: { id: 'c' }, position: 2, total: 3 });
  });

  it('has no newer page for the latest and no older page for the first', () => {
    expect(pagePosition(journal, 'c')).toMatchObject({ newer: null, older: { id: 'b' }, position: 3 });
    expect(pagePosition(journal, 'a')).toMatchObject({ older: null, newer: { id: 'b' }, position: 1 });
  });

  it('handles a journal of one page', () => {
    expect(pagePosition([e('only')], 'only')).toMatchObject({ older: null, newer: null, position: 1, total: 1 });
  });

  it('returns null for an unknown or missing id', () => {
    expect(pagePosition(journal, 'zzz')).toBeNull();
    expect(pagePosition(journal, undefined)).toBeNull();
    expect(pagePosition([], 'a')).toBeNull();
  });
});

describe('ruledLineCount', () => {
  it('covers the text and leaves a couple of spare lines', () => {
    expect(ruledLineCount(96, 32)).toBe(5); // 3 lines of text + 2
    expect(ruledLineCount(97, 32)).toBe(6);
  });
  it('draws nothing before the text has been measured', () => {
    expect(ruledLineCount(0, 32)).toBe(0);
  });
});
