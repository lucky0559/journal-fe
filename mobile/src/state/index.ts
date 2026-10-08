import { openDb, type Db } from '@/data/db';
import { createEntryRepo } from '@/data/entryRepo';
import { createSettingsRepo } from '@/data/settingsRepo';
import { localOnlyGateway } from '@/data/sharing';
import { createEntriesStore } from './entriesStore';
import { createSettingsStore } from './settingsStore';
import { useLock } from './lockStore';

let db: Db | null = null;
const need = (): Db => {
  if (!db) throw new Error('bootstrapState() has not finished');
  return db;
};

export const useEntries = createEntriesStore(() => createEntryRepo(need()), localOnlyGateway);
export const useSettings = createSettingsStore(() => createSettingsRepo(need()));

export async function bootstrapState(): Promise<void> {
  db = await openDb();
  await Promise.all([useSettings.getState().load(), useEntries.getState().load()]);
  const { lockOn, onboarded } = useSettings.getState().settings;
  if (lockOn && onboarded) useLock.getState().lock();
}
