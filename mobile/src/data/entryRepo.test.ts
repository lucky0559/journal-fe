/** @jest-environment node */
import type { Entry } from '@/domain/types';
import { createTestDb } from './testDb';
import { migrate } from './migrations';
import { createEntryRepo } from './entryRepo';

const entry = (over: Partial<Entry> = {}): Entry => ({
  id: 'a', createdAt: 1000, date: '2026-10-07', time: '10:02 pm', mood: 72, feelings: ['calm'],
  text: 'hi', prompt: '', vis: 'private', photos: [], voices: [], stickers: [], ...over,
});

async function setup() {
  const db = createTestDb();
  await migrate(db);
  return { db, repo: createEntryRepo(db) };
}

describe('entryRepo', () => {
  it('round-trips an entry with attachments and awkward text', async () => {
    const { repo } = await setup();
    const e = entry({
      text: `It’s "fine"; DROP TABLE entries; -- 🙂\nline two`,
      photos: [{ id: 'p1', uri: 'file:///x.jpg' }, { id: 'p2', uri: '', label: 'photo · river' }],
      voices: [{ id: 'v1', uri: 'file:///v.m4a', seconds: 38 }],
      stickers: ['cozy', 'calm'], vis: 'friends', prompt: 'Who did you feel close to today?',
    });
    await repo.upsert(e);
    expect(await repo.list()).toEqual([e]);
  });

  it('orders by date desc then createdAt desc', async () => {
    const { repo } = await setup();
    await repo.upsert(entry({ id: 'old', date: '2026-09-01' }));
    await repo.upsert(entry({ id: 'a', date: '2026-10-07', createdAt: 1 }));
    await repo.upsert(entry({ id: 'b', date: '2026-10-07', createdAt: 2 }));
    expect((await repo.list()).map((e) => e.id)).toEqual(['b', 'a', 'old']);
  });

  it('upsert replaces instead of duplicating', async () => {
    const { repo } = await setup();
    await repo.upsert(entry({ text: 'one' }));
    await repo.upsert(entry({ text: 'two' }));
    const list = await repo.list();
    expect(list).toHaveLength(1);
    expect(list[0].text).toBe('two');
  });

  it('replaceAll swaps the whole set', async () => {
    const { repo } = await setup();
    await repo.upsert(entry({ id: 'x' }));
    await repo.replaceAll([entry({ id: 'y' }), entry({ id: 'z', date: '2026-10-08' })]);
    expect((await repo.list()).map((e) => e.id)).toEqual(['z', 'y']);
  });

  it('survives a corrupt JSON column instead of throwing', async () => {
    const { db, repo } = await setup();
    await db.runAsync(
      `INSERT INTO entries (id, created_at, date, time, mood, feelings, text, prompt, vis, photos, voices, stickers)
       VALUES ('bad', 1, '2026-10-07', '9:00 pm', 50, 'not json', 'x', '', 'private', '[', '', 'null')`,
    );
    const [e] = await repo.list();
    expect(e).toMatchObject({ id: 'bad', feelings: [], photos: [], voices: [], stickers: [] });
  });

  it('migrate is idempotent', async () => {
    const { db } = await setup();
    await expect(migrate(db)).resolves.toBeUndefined();
  });
});
