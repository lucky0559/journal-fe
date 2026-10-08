import { openDb, type Db } from '@/data/db';
import { createEntryRepo } from '@/data/entryRepo';
import { createSettingsRepo } from '@/data/settingsRepo';
import { localOnlyGateway } from '@/data/sharing';
import { createEntriesStore } from './entriesStore';
import { createSettingsStore } from './settingsStore';
import { useLock } from './lockStore';
import { useAuth } from '@/auth';
import { reconcileLock } from '@/features/lock/reconcileLock';
import { pinVault } from '@/data/pinVaultInstance';
import { DEMO_DATA } from '@/config';
import { demoEntries } from '@/domain/demoData';
import { todayIso } from '@/lib/dates';

let db: Db | null = null;
const need = (): Db => {
  if (!db) throw new Error('bootstrapState() has not finished');
  return db;
};

export const useEntries = createEntriesStore(() => createEntryRepo(need()), localOnlyGateway);
export const useSettings = createSettingsStore(() => createSettingsRepo(need()));

export async function bootstrapState(): Promise<void> {
  db = await openDb();
  await Promise.all([useSettings.getState().load(), useEntries.getState().load(), useAuth.getState().restore()]);
  if (DEMO_DATA && !useSettings.getState().settings.onboarded && useEntries.getState().entries.length === 0) {
    await useEntries.getState().replaceAll(demoEntries(todayIso()));
  }
  const { lockOn, onboarded } = useSettings.getState().settings;
  const stillOn = await reconcileLock(lockOn, pinVault);
  if (lockOn && !stillOn) await useSettings.getState().update({ lockOn: false });
  if (stillOn && onboarded) useLock.getState().lock();
}
