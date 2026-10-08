import * as Notifications from 'expo-notifications';
import { syncReminders } from './reminders';

jest.mock('expo-notifications', () => ({
  cancelAllScheduledNotificationsAsync: jest.fn(async () => {}),
  scheduleNotificationAsync: jest.fn(async () => 'id'),
  setNotificationChannelAsync: jest.fn(async () => null),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  AndroidImportance: { DEFAULT: 3 },
  SchedulableTriggerInputTypes: { DAILY: 'daily' },
}));
const n = Notifications as jest.Mocked<typeof Notifications>;

beforeEach(() => {
  jest.clearAllMocks();
  n.getPermissionsAsync.mockResolvedValue({ granted: true, canAskAgain: true } as never);
});

it('turns everything off when reminders are off', async () => {
  expect(await syncReminders({ remind: false, remindTime: '9:00 pm' })).toBe('off');
  expect(n.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
  expect(n.scheduleNotificationAsync).not.toHaveBeenCalled();
});

it('schedules one daily notification at the chosen time', async () => {
  expect(await syncReminders({ remind: true, remindTime: '10:00 pm' })).toBe('scheduled');
  expect(n.scheduleNotificationAsync).toHaveBeenCalledTimes(1);
  expect(n.scheduleNotificationAsync).toHaveBeenCalledWith(
    expect.objectContaining({ trigger: expect.objectContaining({ type: 'daily', hour: 22, minute: 0 }) }),
  );
});

it('cancels before scheduling so changing the time never leaves two reminders', async () => {
  await syncReminders({ remind: true, remindTime: '9:00 pm' });
  await syncReminders({ remind: true, remindTime: '11:00 pm' });
  expect(n.cancelAllScheduledNotificationsAsync).toHaveBeenCalledTimes(2);
  expect(n.scheduleNotificationAsync).toHaveBeenCalledTimes(2);
  const cancel = n.cancelAllScheduledNotificationsAsync.mock.invocationCallOrder;
  const schedule = n.scheduleNotificationAsync.mock.invocationCallOrder;
  // cancel, schedule, cancel, schedule: each schedule is preceded by its own cancel
  expect(cancel[0]).toBeLessThan(schedule[0]);
  expect(schedule[0]).toBeLessThan(cancel[1]);
  expect(cancel[1]).toBeLessThan(schedule[1]);
});

it('asks for permission once when it can, and schedules if granted', async () => {
  n.getPermissionsAsync.mockResolvedValue({ granted: false, canAskAgain: true } as never);
  n.requestPermissionsAsync.mockResolvedValue({ granted: true } as never);
  expect(await syncReminders({ remind: true, remindTime: '9:00 pm' })).toBe('scheduled');
  expect(n.requestPermissionsAsync).toHaveBeenCalledTimes(1);
});

it('reports denied, without scheduling, when permission is refused or blocked', async () => {
  n.getPermissionsAsync.mockResolvedValue({ granted: false, canAskAgain: true } as never);
  n.requestPermissionsAsync.mockResolvedValue({ granted: false } as never);
  expect(await syncReminders({ remind: true, remindTime: '9:00 pm' })).toBe('denied');
  n.getPermissionsAsync.mockResolvedValue({ granted: false, canAskAgain: false } as never);
  expect(await syncReminders({ remind: true, remindTime: '9:00 pm' })).toBe('denied');
  expect(n.scheduleNotificationAsync).not.toHaveBeenCalled();
});

it('falls back to 9 pm if the saved time is corrupt', async () => {
  await syncReminders({ remind: true, remindTime: 'banana' });
  expect(n.scheduleNotificationAsync).toHaveBeenCalledWith(expect.objectContaining({ trigger: expect.objectContaining({ hour: 21, minute: 0 }) }));
});
