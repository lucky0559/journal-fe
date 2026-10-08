import * as Notifications from 'expo-notifications';
import { parseTimeLabel } from '@/lib/time';
import { useLock } from '@/state/lockStore';

export type ReminderResult = 'scheduled' | 'off' | 'denied';

const CHANNEL = 'nightly-nudge';

async function ensurePermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  return useLock.getState().withoutRelock(async () => (await Notifications.requestPermissionsAsync()).granted);
}

/** One reminder, never more: cancel everything first, then schedule a single daily notification. */
export async function syncReminders(s: { remind: boolean; remindTime: string }): Promise<ReminderResult> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!s.remind) return 'off';
  await Notifications.setNotificationChannelAsync(CHANNEL, { name: 'Nightly nudge', importance: Notifications.AndroidImportance.DEFAULT });
  if (!(await ensurePermission())) return 'denied';
  const { hour, minute } = parseTimeLabel(s.remindTime);
  await Notifications.scheduleNotificationAsync({
    content: { title: 'Time to wind down', body: 'A mood, a few words. Two minutes is plenty.' },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute, channelId: CHANNEL },
  });
  return 'scheduled';
}
