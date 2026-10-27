import { Alert } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ApiError } from '@/api/client';
import { apiPost, sol } from '../../../test/fixtures';
import { useToast } from '@/state/toastStore';
import { ProfileScreen } from './ProfileScreen';

const mockBack = jest.fn();
const mockSocial = {
  user: jest.fn(), userPosts: jest.fn(), requestFriend: jest.fn(), cancelRequest: jest.fn(),
  accept: jest.fn(), decline: jest.fn(), unfriend: jest.fn(), react: jest.fn(), unreact: jest.fn(),
};
jest.mock('expo-router', () => ({ useRouter: () => ({ back: mockBack, push: jest.fn() }) }));
jest.mock('@/social', () => ({ social: new Proxy({}, { get: (_t, k: string) => (...a: unknown[]) => (mockSocial as Record<string, (...x: unknown[]) => unknown>)[k](...a) }) }));

const wrap = () =>
  render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 360, height: 800 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <ProfileScreen personId={sol.id} />
    </SafeAreaProvider>,
  );

const profile = (friendState: string) => ({ ...sol, friendState });
const pages = (n: number, hidden = 0) => ({ posts: Array.from({ length: n }, (_, i) => apiPost(`p${i}`, sol, { vis: 'public' })), nextBefore: null, hidden });

beforeEach(() => {
  jest.clearAllMocks();
  useToast.setState({ message: '' });
  mockSocial.user.mockResolvedValue(profile('none'));
  mockSocial.userPosts.mockResolvedValue(pages(2));
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});

it('shows the person, their bio and the pages you can read', async () => {
  wrap();
  expect(await screen.findByText('Sol Rivera')).toBeTruthy();
  expect(screen.getByText('One line a day.')).toBeTruthy();
  expect(await screen.findByText('2 pages you can read')).toBeTruthy();
  expect(screen.queryByText(/for friends only/)).toBeNull();
  expect(mockSocial.user).toHaveBeenCalledWith(sol.id);
});

it('tells strangers how many friends-only pages are hidden', async () => {
  mockSocial.userPosts.mockResolvedValue(pages(1, 2));
  wrap();
  expect(await screen.findByText('2 more pages are for friends only.')).toBeTruthy();
});

it('sends a friend request, then lets you cancel it', async () => {
  mockSocial.requestFriend.mockResolvedValue('requested');
  mockSocial.cancelRequest.mockResolvedValue(undefined);
  wrap();
  const btn = await screen.findByRole('button', { name: 'Add friend' });
  await act(async () => { fireEvent.press(btn); });
  expect(mockSocial.requestFriend).toHaveBeenCalledWith(sol.id);
  expect(useToast.getState().message).toBe('Friend request sent to Sol Rivera');
  await act(async () => { fireEvent.press(screen.getByRole('button', { name: 'Request sent' })); });
  expect(mockSocial.cancelRequest).toHaveBeenCalledWith(sol.id);
  expect(screen.getByRole('button', { name: 'Add friend' })).toBeTruthy();
});

it('says so when asking turns straight into a friendship (they had asked you)', async () => {
  mockSocial.requestFriend.mockResolvedValue('friends');
  wrap();
  const btn = await screen.findByRole('button', { name: 'Add friend' });
  await act(async () => { fireEvent.press(btn); });
  expect(useToast.getState().message).toBe('You and Sol Rivera are now friends');
  expect(screen.getByRole('button', { name: 'Friends' })).toBeTruthy();
});

it('accepts or declines an incoming request', async () => {
  mockSocial.user.mockResolvedValue(profile('incoming'));
  mockSocial.accept.mockResolvedValue('friends');
  mockSocial.decline.mockResolvedValue(undefined);
  wrap();
  const btn = await screen.findByRole('button', { name: 'Accept request' });
  await act(async () => { fireEvent.press(btn); });
  expect(mockSocial.accept).toHaveBeenCalledWith(sol.id);
  expect(screen.getByRole('button', { name: 'Friends' })).toBeTruthy();
});

it('declines an incoming request', async () => {
  mockSocial.user.mockResolvedValue(profile('incoming'));
  mockSocial.decline.mockResolvedValue(undefined);
  wrap();
  const btn = await screen.findByRole('button', { name: 'Decline' });
  await act(async () => { fireEvent.press(btn); });
  expect(mockSocial.decline).toHaveBeenCalledWith(sol.id);
  expect(screen.getByRole('button', { name: 'Add friend' })).toBeTruthy();
});

it('asks before removing a friend, then removes them and reloads their pages', async () => {
  mockSocial.user.mockResolvedValue(profile('friends'));
  mockSocial.unfriend.mockResolvedValue(undefined);
  wrap();
  fireEvent.press(await screen.findByRole('button', { name: 'Friends' }));
  expect(Alert.alert).toHaveBeenCalledWith('Remove Sol Rivera?', expect.any(String), expect.any(Array));
  expect(mockSocial.unfriend).not.toHaveBeenCalled();
  const buttons = (Alert.alert as jest.Mock).mock.calls[0][2] as { text: string; onPress?: () => void }[];
  mockSocial.userPosts.mockClear();
  await act(async () => { buttons.find((b) => b.text === 'Remove')!.onPress!(); });
  expect(mockSocial.unfriend).toHaveBeenCalledWith(sol.id);
  expect(screen.getByRole('button', { name: 'Add friend' })).toBeTruthy();
  expect(mockSocial.userPosts).toHaveBeenCalled();
});

it('shows your own profile without a friend button', async () => {
  mockSocial.user.mockResolvedValue(profile('self'));
  wrap();
  expect(await screen.findByText('This is you')).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Add friend' })).toBeNull();
});

it('reports a failed action instead of changing state', async () => {
  mockSocial.requestFriend.mockRejectedValue(new Error('offline'));
  wrap();
  const btn = await screen.findByRole('button', { name: 'Add friend' });
  await act(async () => { fireEvent.press(btn); });
  expect(useToast.getState().message).toBe('Couldn’t update that. Try again.');
  expect(screen.getByRole('button', { name: 'Add friend' })).toBeTruthy();
});

it('says when the profile does not exist', async () => {
  mockSocial.user.mockRejectedValue(new ApiError(404, {}));
  wrap();
  expect(await screen.findByText('We couldn’t find that profile.')).toBeTruthy();
});

it('offers a retry when the profile fails to load', async () => {
  mockSocial.user.mockRejectedValueOnce(new ApiError(0, null));
  wrap();
  expect(await screen.findByText('Couldn’t load this profile.')).toBeTruthy();
  await act(async () => { fireEvent.press(screen.getByText('Try again')); });
  expect(await screen.findByText('Sol Rivera')).toBeTruthy();
});

it('goes back', async () => {
  wrap();
  await screen.findByText('Sol Rivera');
  fireEvent.press(screen.getByLabelText('Back'));
  expect(mockBack).toHaveBeenCalled();
});
