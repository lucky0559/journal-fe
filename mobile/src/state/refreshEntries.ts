import { useNotifications } from './notificationsStore';
import { useEntries } from './index';

/** Pull-to-refresh for your own pages: send what is waiting, bring back what changed elsewhere, and re-check the bell. */
export async function refreshEntries(): Promise<void> {
  const entries = useEntries.getState();
  void useNotifications.getState().refresh();
  await entries.syncPending();
  await entries.restore();
}
