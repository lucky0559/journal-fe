import { renderHook, waitFor } from '@testing-library/react-native';
import { useSettings } from '@/state';
import { useToast } from '@/state/toastStore';
import { useRemindersSync } from './useRemindersSync';

const mockSync = jest.fn();
jest.mock('./reminders', () => ({ syncReminders: (...a: unknown[]) => mockSync(...a) }));
jest.mock('@/state', () => {
  const { create } = require('zustand');
  const update = jest.fn(async () => {});
  return {
    useSettings: Object.assign(
      create(() => ({ loaded: true, settings: { name: 'M', remind: true, remindTime: '9:00 pm', lockOn: false, onboarded: true }, update })),
      { __update: update },
    ),
  };
});
const set = (s: object) => (useSettings as unknown as { setState: (v: object) => void }).setState(s);
const update = (useSettings as unknown as { __update: jest.Mock }).__update;

beforeEach(() => {
  jest.clearAllMocks();
  mockSync.mockResolvedValue('scheduled');
  useToast.setState({ message: '' });
  set({ loaded: true, settings: { name: 'M', remind: true, remindTime: '9:00 pm', lockOn: false, onboarded: true } });
});

it('does not ask for notification permission before onboarding is finished', () => {
  set({ settings: { name: '', remind: true, remindTime: '9:00 pm', lockOn: false, onboarded: false } });
  renderHook(() => useRemindersSync());
  expect(mockSync).not.toHaveBeenCalled();
});

it('syncs once settings are loaded and onboarded, and again when the time changes', async () => {
  renderHook(() => useRemindersSync());
  await waitFor(() => expect(mockSync).toHaveBeenCalledWith({ remind: true, remindTime: '9:00 pm' }));
  set({ settings: { name: 'M', remind: true, remindTime: '10:00 pm', lockOn: false, onboarded: true } });
  await waitFor(() => expect(mockSync).toHaveBeenLastCalledWith({ remind: true, remindTime: '10:00 pm' }));
});

it('turns the reminder off and says so when permission is denied', async () => {
  mockSync.mockResolvedValue('denied');
  renderHook(() => useRemindersSync());
  await waitFor(() => expect(update).toHaveBeenCalledWith({ remind: false }));
  expect(useToast.getState().message).toBe('Notifications are off for this app');
});
