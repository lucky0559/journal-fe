import { AppState } from 'react-native';
import { act, renderHook } from '@testing-library/react-native';
import { useAuth } from '@/auth';
import { useEntries, useSettings } from '@/state';
import { useSyncPending } from './useSyncPending';

const mockSync = jest.fn(async () => {});
const mockReset = jest.fn(async () => {});
const mockUpdate = jest.fn(async (_p: unknown) => {});

jest.mock('@/state', () => {
  const { create } = require('zustand');
  return {
    useEntries: Object.assign(create(() => ({ loaded: true, syncPending: (...a: unknown[]) => mockSync(...(a as [])), resetSharing: () => mockReset() })), {}),
    useSettings: create(() => ({ loaded: true, settings: { syncOwner: '' }, update: (p: unknown) => mockUpdate(p) })),
  };
});

const user = { id: 'u1', email: 'a@b.c', name: 'A', givenName: 'A', photo: null };
const setSettings = (syncOwner: string) => (useSettings as unknown as { setState: (s: object) => void }).setState({ settings: { syncOwner } });
let handler: (s: string) => void = () => {};

beforeEach(() => {
  jest.clearAllMocks();
  useAuth.setState({ status: 'signedIn', user });
  setSettings('');
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_t, h) => { handler = h as never; return { remove: jest.fn() } as never; });
});

it('adopts the first account without touching shared pages, then syncs', async () => {
  renderHook(() => useSyncPending());
  await act(async () => {});
  expect(mockUpdate).toHaveBeenCalledWith({ syncOwner: 'u1' });
  expect(mockReset).not.toHaveBeenCalled();
  expect(mockSync).toHaveBeenCalled();
});

it('resets sharing when a different account signs in on the same phone', async () => {
  setSettings('someone-else');
  renderHook(() => useSyncPending());
  await act(async () => {});
  expect(mockReset).toHaveBeenCalledTimes(1);
  expect(mockUpdate).toHaveBeenCalledWith({ syncOwner: 'u1' });
});

it('does nothing for the same account except sync', async () => {
  setSettings('u1');
  renderHook(() => useSyncPending());
  await act(async () => {});
  expect(mockReset).not.toHaveBeenCalled();
  expect(mockUpdate).not.toHaveBeenCalled();
  expect(mockSync).toHaveBeenCalled();
});

it('does not sync while signed out', async () => {
  useAuth.setState({ status: 'signedOut', user: null });
  renderHook(() => useSyncPending());
  await act(async () => {});
  expect(mockSync).not.toHaveBeenCalled();
});

it('syncs again whenever the app returns to the foreground', async () => {
  setSettings('u1');
  renderHook(() => useSyncPending());
  await act(async () => {});
  mockSync.mockClear();
  handler('background');
  expect(mockSync).not.toHaveBeenCalled();
  handler('active');
  expect(mockSync).toHaveBeenCalledTimes(1);
});
