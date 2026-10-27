import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useAuth } from '@/auth';
import { useEntries, useSettings } from '@/state';

/** Keeps shared pages and queued unpublishes in step with the server. */
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
        // First account on this phone adopts the pages; a different account must not inherit someone else's shared pages.
        if (owner) await useEntries.getState().resetSharing();
        await useSettings.getState().update({ syncOwner: userId });
      }
      if (alive) await useEntries.getState().syncPending();
    })().catch(() => {});
    return () => { alive = false; };
  }, [status, userId, entriesLoaded, settingsLoaded, owner]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active' && useAuth.getState().status === 'signedIn') void useEntries.getState().syncPending();
    });
    return () => sub.remove();
  }, []);
}
