import Database from 'better-sqlite3';
import type { Db, SqlValue } from './db';

export function createTestDb(): Db {
  const d = new Database(':memory:');
  return {
    execAsync: async (sql) => { d.exec(sql); },
    runAsync: async (sql, ...p: SqlValue[]) => d.prepare(sql).run(...p),
    getAllAsync: async <T,>(sql: string, ...p: SqlValue[]) => d.prepare(sql).all(...p) as T[],
    getFirstAsync: async <T,>(sql: string, ...p: SqlValue[]) => (d.prepare(sql).get(...p) as T | undefined) ?? null,
  };
}
