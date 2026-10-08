import { AppState } from 'react-native';
import { renderHook } from '@testing-library/react-native';
import { useSettings } from '@/state';
import { useLock } from '@/state/lockStore';
import { useRelockOnBackground } from './useRelockOnBackground';

jest.mock('@/state', () => {
  const { create } = require('zustand');
  return { useSettings: create(() => ({ settings: { lockOn: true } })) };
});

let handler: (s: string) => void = () => {};
beforeEach(() => {
  useLock.setState({ locked: false, suspended: 0 });
  (useSettings as unknown as { setState: (s: unknown) => void }).setState({ settings: { lockOn: true } });
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_t, h) => { handler = h as never; return { remove: jest.fn() } as never; });
});

it('locks when the app leaves the foreground and app lock is on', () => {
  renderHook(() => useRelockOnBackground());
  handler('background');
  expect(useLock.getState().locked).toBe(true);
});

it('does nothing when app lock is off', () => {
  (useSettings as unknown as { setState: (s: unknown) => void }).setState({ settings: { lockOn: false } });
  renderHook(() => useRelockOnBackground());
  handler('background');
  expect(useLock.getState().locked).toBe(false);
});

it('does not lock while a system dialog (picker, camera, permission) is open', () => {
  useLock.setState({ suspended: 1 });
  renderHook(() => useRelockOnBackground());
  handler('background');
  expect(useLock.getState().locked).toBe(false);
});

it('ignores returning to the foreground', () => {
  renderHook(() => useRelockOnBackground());
  handler('active');
  expect(useLock.getState().locked).toBe(false);
});
