import { useEffect } from 'react';
import { useSettings } from '@/state';
import { useToast } from '@/state/toastStore';
import { syncReminders } from './reminders';

export function useRemindersSync(): void {
  const loaded = useSettings((s) => s.loaded);
  const onboarded = useSettings((s) => s.settings.onboarded);
  const remind = useSettings((s) => s.settings.remind);
  const remindTime = useSettings((s) => s.settings.remindTime);

  useEffect(() => {
    // Wait until onboarding is finished so the permission prompt never interrupts the welcome flow.
    if (!loaded || !onboarded) return;
    let alive = true;
    syncReminders({ remind, remindTime })
      .then(async (r) => {
        if (alive && r === 'denied') {
          await useSettings.getState().update({ remind: false });
          useToast.getState().show('Notifications are off for this app');
        }
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [loaded, onboarded, remind, remindTime]);
}
