import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuth } from '@/auth';
import { useSettings } from '@/state';
import { useLock } from '@/state/lockStore';
import { useToast } from '@/state/toastStore';
import { MeScreen } from './MeScreen';

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockSignOut = jest.fn(async () => {});
const mockClear = jest.fn(async () => {});
const mockExport = jest.fn(async (..._a: unknown[]) => 'shared');
const mockReplaceAll = jest.fn(async (..._a: unknown[]) => {});
const mockUpdate = jest.fn(async (..._a: unknown[]) => {});
let mockDemo = false;

jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush, replace: mockReplace }) }));
jest.mock('@/config', () => ({ get DEMO_DATA() { return mockDemo; } }));
jest.mock('@/data/pinVaultInstance', () => ({ pinVault: { clear: () => mockClear() } }));
jest.mock('@/services/exporter', () => ({ exportPages: (...a: unknown[]) => mockExport(...a) }));
jest.mock('@/state', () => {
  const { create } = require('zustand');
  const { demoEntries } = require('@/domain/demoData');
  return {
    useSettings: create(() => ({
      settings: { name: 'Maya', remind: true, remindTime: '9:00 pm', lockOn: false, onboarded: true },
      loaded: true,
      update: (...a: unknown[]) => mockUpdate(...a),
    })),
    useEntries: create(() => ({ entries: demoEntries('2026-10-08'), replaceAll: (...a: unknown[]) => mockReplaceAll(...a) })),
  };
});

const DEFAULTS = { name: 'Maya', remind: true, remindTime: '9:00 pm', lockOn: false, onboarded: true, syncOwner: '' };
const withSettings = (patch: Partial<typeof DEFAULTS>) => useSettings.setState({ settings: { ...DEFAULTS, ...patch } });

const wrap = () =>
  render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 360, height: 800 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <MeScreen />
    </SafeAreaProvider>,
  );

beforeEach(() => {
  jest.clearAllMocks();
  mockDemo = false;
  withSettings({});
  useToast.setState({ message: '' });
  useLock.setState({ locked: false, suspended: 0 });
});

it('shows the name and page count', () => {
  wrap();
  expect(screen.getByText('Maya')).toBeTruthy();
  expect(screen.getByText('8 pages so far')).toBeTruthy();
});

it('nightly nudge: choosing a time turns it on, the switch turns it off', async () => {
  wrap();
  expect(screen.getByRole('button', { name: '9:00 pm' })).toBeSelected();
  await act(async () => { fireEvent.press(screen.getByRole('button', { name: '11:00 pm' })); });
  expect(mockUpdate).toHaveBeenCalledWith({ remindTime: '11:00 pm', remind: true });
  await act(async () => { fireEvent.press(screen.getByRole('switch', { name: 'Nightly nudge' })); });
  expect(mockUpdate).toHaveBeenCalledWith({ remind: false });
});

it('hides the time chips when reminders are off', () => {
  withSettings({ remind: false });
  wrap();
  expect(screen.queryByRole('button', { name: '9:00 pm' })).toBeNull();
});

it('app lock on starts the PIN flow', () => {
  wrap();
  fireEvent.press(screen.getByRole('switch', { name: 'App lock' }));
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/pin', params: { after: 'me' } });
  expect(screen.queryByText('Lock now')).toBeNull();
});

it('app lock off clears the PIN, turns the flag off and says so', async () => {
  withSettings({ lockOn: true });
  wrap();
  await act(async () => { fireEvent.press(screen.getByRole('switch', { name: 'App lock' })); });
  expect(mockClear).toHaveBeenCalled();
  expect(mockUpdate).toHaveBeenCalledWith({ lockOn: false });
  expect(useToast.getState().message).toBe('App lock is off');
});

it('"Lock now" locks the app', () => {
  withSettings({ lockOn: true });
  wrap();
  fireEvent.press(screen.getByText('Lock now'));
  expect(useLock.getState().locked).toBe(true);
});

it('export announces itself and runs the exporter with all pages', async () => {
  wrap();
  await act(async () => { fireEvent.press(screen.getByText('Export my pages')); });
  expect(mockExport).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ id: 'demo-1' })]), 'Maya');
  expect(useToast.getState().message).toBe('Exporting 8 pages as PDF…');
});

it('export reports when sharing is unavailable or fails', async () => {
  wrap();
  mockExport.mockResolvedValueOnce('unavailable' as never);
  await act(async () => { fireEvent.press(screen.getByText('Export my pages')); });
  expect(useToast.getState().message).toBe('Sharing isn’t available on this device');
  mockExport.mockRejectedValueOnce(new Error('print failed'));
  await act(async () => { fireEvent.press(screen.getByText('Export my pages')); });
  expect(useToast.getState().message).toBe('Couldn’t export your pages. Try again.');
});

it('replay pushes the welcome flow', () => {
  wrap();
  fireEvent.press(screen.getByText('Replay the welcome'));
  expect(mockPush).toHaveBeenCalledWith('/onboarding');
});

it('has no "Reset demo data" row outside demo builds', () => {
  wrap();
  expect(screen.queryByText('Reset demo data')).toBeNull();
});

it('reset demo data restores the sample pages in demo builds', async () => {
  mockDemo = true;
  wrap();
  await act(async () => { fireEvent.press(screen.getByText('Reset demo data')); });
  expect(mockReplaceAll).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ id: 'demo-1' })]));
  expect(useToast.getState().message).toBe('Demo data restored');
});

describe('Google account', () => {
  it('shows who is signed in and signs out to the login screen', async () => {
    useAuth.setState({
      status: 'signedIn', signOut: (() => mockSignOut()) as never,
      user: { id: 'g1', email: 'maya@example.com', name: 'Maya Cruz', givenName: 'Maya', photo: null },
    });
    wrap();
    expect(screen.getByText('maya@example.com')).toBeTruthy();
    await act(async () => { fireEvent.press(screen.getByText('Sign out')); });
    expect(mockSignOut).toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith('/login');
  });

  it('hides the account row when nobody is signed in', () => {
    useAuth.setState({ status: 'signedOut', user: null });
    wrap();
    expect(screen.queryByText('Sign out')).toBeNull();
  });
});
