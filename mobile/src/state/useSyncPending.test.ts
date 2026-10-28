import { AppState } from 'react-native';
import { act, renderHook } from '@testing-library/react-native';
import { useAuth } from '@/auth';
import { useEntries, useSettings } from '@/state';
import { useSyncPending } from './useSyncPending';

const mockSync = jest.fn(async () => {});
const mockRestore = jest.fn(async () => 0);
const mockReset = jest.fn(async () => {});
const mockUpdate = jest.fn(async (_p: unknown) => {});

jest.mock('@/state', () => {
  const { create } = require('zustand');
  return {
    useEntries: Object.assign(
      create(() => ({
        loaded: true,
        syncPending: (...a: unknown[]) => mockSync(...(a as [])),
        restore: () => mockRestore(),
        resetForNewAccount: () => mockReset(),
      })),
      {},
    ),
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

it('adopts the first account’s pages without clearing anything, then saves them and pulls the account', async () => {
  renderHook(() => useSyncPending());
  await act(async () => {});
  expect(mockUpdate).toHaveBeenCalledWith({ syncOwner: 'u1' });
  expect(mockReset).not.toHaveBeenCalled();
  expect(mockSync).toHaveBeenCalled();
  expect(mockRestore).toHaveBeenCalled();
});

it('starts a different account from its own journal, never handing it the previous account’s pages', async () => {
  setSettings('someone-else');
  renderHook(() => useSyncPending());
  await act(async () => {});
  expect(mockReset).toHaveBeenCalledTimes(1);
  expect(mockUpdate).toHaveBeenCalledWith({ syncOwner: 'u1' });
});

it('pushes what is on the phone before pulling from the account', async () => {
  setSettings('u1');
  const order: string[] = [];
  mockSync.mockImplementationOnce(async () => { order.push('push'); });
  mockRestore.mockImplementationOnce(async () => { order.push('pull'); return 0; });
  renderHook(() => useSyncPending());
  await act(async () => {});
  expect(order).toEqual(['push', 'pull']);
});

it('does nothing for the same account except sync and restore', async () => {
  setSettings('u1');
  renderHook(() => useSyncPending());
  await act(async () => {});
  expect(mockReset).not.toHaveBeenCalled();
  expect(mockUpdate).not.toHaveBeenCalled();
  expect(mockSync).toHaveBeenCalled();
  expect(mockRestore).toHaveBeenCalled();
});

it('shrugs off a failed restore (offline)', async () => {
  setSettings('u1');
  mockRestore.mockRejectedValueOnce(new Error('offline'));
  renderHook(() => useSyncPending());
  await expect(act(async () => {})).resolves.toBeUndefined();
});

it('does not sync or restore while signed out', async () => {
  useAuth.setState({ status: 'signedOut', user: null });
  renderHook(() => useSyncPending());
  await act(async () => {});
  expect(mockSync).not.toHaveBeenCalled();
  expect(mockRestore).not.toHaveBeenCalled();
});

it('syncs and restores again whenever the app returns to the foreground', async () => {
  setSettings('u1');
  renderHook(() => useSyncPending());
  await act(async () => {});
  mockSync.mockClear();
  mockRestore.mockClear();
  handler('background');
  expect(mockSync).not.toHaveBeenCalled();
  await act(async () => { handler('active'); });
  expect(mockSync).toHaveBeenCalledTimes(1);
  expect(mockRestore).toHaveBeenCalledTimes(1);
});
