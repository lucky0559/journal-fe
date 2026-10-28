import { isLegacyDemoEntry } from './legacyDemo';

describe('isLegacyDemoEntry', () => {
  it('recognises the old sample pages', () => {
    expect(isLegacyDemoEntry({ id: 'demo-1', publishedAt: 1 })).toBe(true);
    expect(isLegacyDemoEntry({ id: 'demo-8', publishedAt: 1 })).toBe(true);
  });

  it('never matches real writing: a real page id, or a demo-looking id that has been synced for real', () => {
    expect(isLegacyDemoEntry({ id: '3f1c2d7a-0c5e-4b1b-9f1e-2d6f7a8b9c0d', publishedAt: 1 })).toBe(false);
    expect(isLegacyDemoEntry({ id: 'demo-1', publishedAt: 1761700000000 })).toBe(false);
    expect(isLegacyDemoEntry({ id: 'demo-1', publishedAt: null })).toBe(false);
    expect(isLegacyDemoEntry({ id: 'demo-photo', publishedAt: 1 })).toBe(false);
  });
});
