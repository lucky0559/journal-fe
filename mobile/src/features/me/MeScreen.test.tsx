import { Alert, Share } from 'react-native';
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
const mockDeleteAccount = jest.fn(async () => {});
const mockClear = jest.fn(async () => {});
const mockExport = jest.fn(async (..._a: unknown[]) => 'shared');
const mockDetach = jest.fn(async () => {});
const mockUpdate = jest.fn(async (..._a: unknown[]) => {});

jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush, replace: mockReplace }) }));
jest.mock('@/data/pinVaultInstance', () => ({ pinVault: { clear: () => mockClear() } }));
jest.mock('@/social', () => ({ social: { deleteAccount: () => mockDeleteAccount() } }));
jest.mock('@/services/exporter', () => ({ exportPages: (...a: unknown[]) => mockExport(...a) }));
jest.mock('@/state', () => {
  const { create } = require('zustand');
  const { sampleEntries } = require('../../../test/sampleEntries');
  return {
    useSettings: create(() => ({
      settings: { name: 'Maya', remind: true, remindTime: '9:00 pm', lockOn: false, onboarded: true },
      loaded: true,
      update: (...a: unknown[]) => mockUpdate(...a),
    })),
    useEntries: create(() => ({
      entries: sampleEntries('2026-10-08'),
      detachFromAccount: () => mockDetach(),
    })),
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
  expect(mockExport).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ id: 'sample-1' })]), 'Maya');
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

it('has no demo data controls', () => {
  wrap();
  expect(screen.queryByText(/demo/i)).toBeNull();
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

describe('sharing and deleting the account', () => {
  const user = { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', email: 'maya@example.com', name: 'Maya Cruz', givenName: 'Maya', photo: null };
  beforeEach(() => {
    useAuth.setState({ status: 'signedIn', user, signOut: (() => mockSignOut()) as never });
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' } as never);
  });

  it('shares a profile link friends can open', async () => {
    wrap();
    await act(async () => { fireEvent.press(screen.getByText('Share my profile link')); });
    expect(Share.share).toHaveBeenCalledWith({ message: `Add me on Journal: journal:///friends/${user.id}` });
  });

  it('asks before deleting the account, then deletes it, signs out and goes to login', async () => {
    wrap();
    fireEvent.press(screen.getByText('Delete my account'));
    expect(Alert.alert).toHaveBeenCalledWith('Delete your account?', expect.stringContaining('Pages on this phone stay'), expect.any(Array));
    expect((Alert.alert as jest.Mock).mock.calls[0][1]).toContain('Only me');
    expect(mockDeleteAccount).not.toHaveBeenCalled();
    const buttons = (Alert.alert as jest.Mock).mock.calls[0][2] as { text: string; onPress?: () => void }[];
    await act(async () => { buttons.find((b) => b.text === 'Delete')!.onPress!(); });
    expect(mockDeleteAccount).toHaveBeenCalled();
    expect(mockDetach).toHaveBeenCalled(); // the pages stay here without a server copy
    expect(mockUpdate).toHaveBeenCalledWith({ syncOwner: '' }); // so a later sign-in saves them to its account
    expect(mockSignOut).toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith('/login');
  });

  it('keeps the account and says so if deletion fails', async () => {
    mockDeleteAccount.mockRejectedValueOnce(new Error('offline'));
    wrap();
    fireEvent.press(screen.getByText('Delete my account'));
    const buttons = (Alert.alert as jest.Mock).mock.calls[0][2] as { text: string; onPress?: () => void }[];
    await act(async () => { buttons.find((b) => b.text === 'Delete')!.onPress!(); });
    expect(mockSignOut).not.toHaveBeenCalled();
    expect(mockDetach).not.toHaveBeenCalled(); // nothing changes locally if the server refused
    expect(useToast.getState().message).toBe('Couldn’t delete your account. Try again.');
  });
});
