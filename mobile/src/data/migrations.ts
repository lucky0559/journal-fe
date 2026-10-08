import type { Db } from './db';

const MIGRATIONS: string[] = [
  `CREATE TABLE IF NOT EXISTS entries (
     id TEXT PRIMARY KEY NOT NULL,
     created_at INTEGER NOT NULL,
     date TEXT NOT NULL,
     time TEXT NOT NULL,
     mood INTEGER NOT NULL,
     feelings TEXT NOT NULL DEFAULT '[]',
     text TEXT NOT NULL DEFAULT '',
     prompt TEXT NOT NULL DEFAULT '',
     vis TEXT NOT NULL DEFAULT 'private',
     photos TEXT NOT NULL DEFAULT '[]',
     voices TEXT NOT NULL DEFAULT '[]',
     stickers TEXT NOT NULL DEFAULT '[]'
   );
   CREATE INDEX IF NOT EXISTS entries_date ON entries (date DESC, created_at DESC);
   CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);`,
];

export async function migrate(db: Db): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  for (let v = row?.user_version ?? 0; v < MIGRATIONS.length; v++) {
    await db.execAsync(MIGRATIONS[v]);
    await db.execAsync(`PRAGMA user_version = ${v + 1}`);
  }
}
