import { openDb, type Db } from '@/data/db';
import { createEntryRepo } from '@/data/entryRepo';
import { createSettingsRepo } from '@/data/settingsRepo';
import { api } from '@/api';
import { createApiSharingGateway } from '@/api/apiSharingGateway';
import { createEntriesStore } from './entriesStore';
import { createSettingsStore } from './settingsStore';
import { useLock } from './lockStore';
import { useAuth } from '@/auth';
import { reconcileLock } from '@/features/lock/reconcileLock';
import { pinVault } from '@/data/pinVaultInstance';
import { isLegacyDemoEntry } from '@/domain/legacyDemo';

let db: Db | null = null;
const need = (): Db => {
  if (!db) throw new Error('bootstrapState() has not finished');
  return db;
};

export const useEntries = createEntriesStore(() => createEntryRepo(need()), createApiSharingGateway({ api }));
export const useSettings = createSettingsStore(() => createSettingsRepo(need()));

export async function bootstrapState(): Promise<void> {
  db = await openDb();
  await Promise.all([useSettings.getState().load(), useEntries.getState().load(), useAuth.getState().restore()]);
  // Earlier development builds seeded sample pages: clear them out of any phone that still has them.
  const leftovers = useEntries.getState().entries.filter(isLegacyDemoEntry);
  if (leftovers.length) await useEntries.getState().dropLocal(leftovers.map((e) => e.id));
  const { lockOn, onboarded } = useSettings.getState().settings;
  const stillOn = await reconcileLock(lockOn, pinVault);
  if (lockOn && !stillOn) await useSettings.getState().update({ lockOn: false });
  if (stillOn && onboarded) useLock.getState().lock();
}
