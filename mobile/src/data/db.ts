import * as SQLite from 'expo-sqlite';
import { migrate } from './migrations';

export type SqlValue = string | number | null;

export interface Db {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, ...params: SqlValue[]): Promise<unknown>;
  getAllAsync<T>(sql: string, ...params: SqlValue[]): Promise<T[]>;
  getFirstAsync<T>(sql: string, ...params: SqlValue[]): Promise<T | null>;
}

export async function openDb(): Promise<Db> {
  const db = await SQLite.openDatabaseAsync('journal.db');
  await migrate(db);
  return db;
}
