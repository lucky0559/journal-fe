import type { Entry, Visibility } from '@/domain/types';
import type { Db } from './db';

interface Row {
  id: string; created_at: number; date: string; time: string; mood: number; feelings: string;
  text: string; prompt: string; vis: string; photos: string; voices: string; stickers: string;
}

function parse<T>(s: string, fallback: T): T {
  try {
    const v = JSON.parse(s);
    return Array.isArray(fallback) && !Array.isArray(v) ? fallback : (v as T);
  } catch {
    return fallback;
  }
}

const toEntry = (r: Row): Entry => ({
  id: r.id, createdAt: r.created_at, date: r.date, time: r.time, mood: r.mood,
  feelings: parse(r.feelings, []), text: r.text, prompt: r.prompt, vis: r.vis as Visibility,
  photos: parse(r.photos, []), voices: parse(r.voices, []), stickers: parse(r.stickers, []),
});

export interface EntryRepo {
  list(): Promise<Entry[]>;
  upsert(e: Entry): Promise<void>;
  replaceAll(es: Entry[]): Promise<void>;
}

const UPSERT = `INSERT OR REPLACE INTO entries
  (id, created_at, date, time, mood, feelings, text, prompt, vis, photos, voices, stickers)
  VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`;

const params = (e: Entry) => [
  e.id, e.createdAt, e.date, e.time, e.mood, JSON.stringify(e.feelings), e.text, e.prompt, e.vis,
  JSON.stringify(e.photos), JSON.stringify(e.voices), JSON.stringify(e.stickers),
];

export function createEntryRepo(db: Db): EntryRepo {
  return {
    async list() {
      const rows = await db.getAllAsync<Row>('SELECT * FROM entries ORDER BY date DESC, created_at DESC');
      return rows.map(toEntry);
    },
    async upsert(e) {
      await db.runAsync(UPSERT, ...params(e));
    },
    async replaceAll(es) {
      await db.execAsync('BEGIN');
      try {
        await db.execAsync('DELETE FROM entries');
        for (const e of es) await db.runAsync(UPSERT, ...params(e));
        await db.execAsync('COMMIT');
      } catch (err) {
        await db.execAsync('ROLLBACK');
        throw err;
      }
    },
  };
}
