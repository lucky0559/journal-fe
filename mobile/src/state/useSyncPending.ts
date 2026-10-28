import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useAuth } from '@/auth';
import { useEntries, useSettings } from '@/state';

async function refresh(): Promise<void> {
  await useEntries.getState().syncPending();
  await useEntries.getState().restore();
}

/** Keeps this phone's journal and the account in step: pushes unsynced pages, then pulls what the account has. */
export function useSyncPending(): void {
  const status = useAuth((s) => s.status);
  const userId = useAuth((s) => s.user?.id);
  const entriesLoaded = useEntries((s) => s.loaded);
  const settingsLoaded = useSettings((s) => s.loaded);
  const owner = useSettings((s) => s.settings.syncOwner);

  useEffect(() => {
    if (status !== 'signedIn' || !userId || !entriesLoaded || !settingsLoaded) return;
    let alive = true;
    (async () => {
      if (owner !== userId) {
        // The first account on this phone adopts the pages already here; a different account must not inherit
        // someone else's journal (it is saved in their account), so it starts from its own.
        if (owner) await useEntries.getState().resetForNewAccount();
        await useSettings.getState().update({ syncOwner: userId });
      }
      if (alive) await refresh();
    })().catch(() => {});
    return () => { alive = false; };
  }, [status, userId, entriesLoaded, settingsLoaded, owner]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active' && useAuth.getState().status === 'signedIn') void refresh().catch(() => {});
    });
    return () => sub.remove();
  }, []);
}
