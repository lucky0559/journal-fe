import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { apiPost, ana, jun, sol } from '../../../test/fixtures';
import { useToast } from '@/state/toastStore';
import { FeedScreen } from './FeedScreen';

const mockPush = jest.fn();
const mockSocial = {
  feed: jest.fn(),
  incoming: jest.fn(),
  accept: jest.fn(),
  decline: jest.fn(),
  react: jest.fn(),
  unreact: jest.fn(),
};
jest.mock('expo-router', () => {
  const React = require('react');
  return { useRouter: () => ({ push: mockPush }), useFocusEffect: (cb: () => void) => React.useEffect(cb, []) };
});
jest.mock('@/social', () => ({ social: new Proxy({}, { get: (_t, k: string) => (...a: unknown[]) => (mockSocial as Record<string, (...x: unknown[]) => unknown>)[k](...a) }) }));

const wrap = () =>
  render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 360, height: 800 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <FeedScreen />
    </SafeAreaProvider>,
  );

const friendsPage = { posts: [apiPost('p1', jun), apiPost('p2', ana, { hug: 5, same: 3 })], nextBefore: null };
const publicPage = { posts: [apiPost('p3', sol, { vis: 'public' })], nextBefore: null };

beforeEach(() => {
  jest.clearAllMocks();
  jest.setSystemTime(new Date(2026, 9, 8, 21, 41));
  useToast.setState({ message: '' });
  mockSocial.feed.mockImplementation(async (tab: string) => (tab === 'friends' ? friendsPage : publicPage));
  mockSocial.incoming.mockResolvedValue([]);
  mockSocial.react.mockResolvedValue(undefined);
  mockSocial.unreact.mockResolvedValue(undefined);
  mockSocial.accept.mockResolvedValue('friends');
  mockSocial.decline.mockResolvedValue(undefined);
});

it('starts on Friends with the explanatory note and the friends’ pages', async () => {
  wrap();
  expect(screen.getByText('Others’ pages')).toBeTruthy();
  expect(screen.getByText('Pages your friends chose to share with you.')).toBeTruthy();
  expect(await screen.findByText('Jun Park')).toBeTruthy();
  expect(screen.getByText('Ana Reyes')).toBeTruthy();
  expect(screen.getByText('text of p1')).toBeTruthy();
  expect(screen.getAllByText('Today · 8:50 pm').length).toBe(2);
  expect(mockSocial.feed).toHaveBeenCalledWith('friends', undefined);
});

it('Public loads the public feed', async () => {
  wrap();
  await screen.findByText('Jun Park');
  fireEvent.press(screen.getByRole('button', { name: 'Public' }));
  expect(await screen.findByText('Sol Rivera')).toBeTruthy();
  expect(screen.getByText('Pages anyone has made public. Tap a name to see more.')).toBeTruthy();
  expect(screen.queryByText('Jun Park')).toBeNull();
});

it('shows a friendly empty state per tab', async () => {
  mockSocial.feed.mockResolvedValue({ posts: [], nextBefore: null });
  wrap();
  expect(await screen.findByText('No pages from friends yet.')).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: 'Public' }));
  expect(await screen.findByText('No public pages yet.')).toBeTruthy();
});

it('shows an error with a retry that works', async () => {
  mockSocial.feed.mockRejectedValueOnce(new Error('down'));
  wrap();
  expect(await screen.findByText('Couldn’t load pages.')).toBeTruthy();
  await act(async () => { fireEvent.press(screen.getByText('Try again')); });
  expect(await screen.findByText('Jun Park')).toBeTruthy();
});

it('loads more pages on demand', async () => {
  mockSocial.feed
    .mockResolvedValueOnce({ posts: [apiPost('p1', jun)], nextBefore: 'cursor' })
    .mockResolvedValueOnce({ posts: [apiPost('p9', ana)], nextBefore: null });
  wrap();
  await screen.findByText('text of p1');
  await act(async () => { fireEvent.press(screen.getByText('Load more')); });
  expect(mockSocial.feed).toHaveBeenLastCalledWith('friends', 'cursor');
  expect(await screen.findByText('text of p9')).toBeTruthy();
  expect(screen.queryByText('Load more')).toBeNull();
});

it('toggles a reaction with an immediate count change, and undoes it with a message on failure', async () => {
  wrap();
  await screen.findByText('Jun Park');
  await act(async () => { fireEvent.press(screen.getByText('Sending a hug · 5')); });
  expect(screen.getByText('Sending a hug · 6')).toBeTruthy();
  expect(mockSocial.react).toHaveBeenCalledWith('p2', 'hug');
  mockSocial.react.mockRejectedValueOnce(new Error('offline'));
  await act(async () => { fireEvent.press(screen.getByText('Same · 3')); });
  expect(screen.getByText('Same · 3')).toBeTruthy();
  expect(useToast.getState().message).toBe('Couldn’t update that. Try again.');
});

it('opens a profile from the author’s name', async () => {
  wrap();
  fireEvent.press((await screen.findAllByLabelText(/^Ana Reyes,/))[0]);
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/friends/[id]', params: { id: ana.id } });
});

it('shows photos, voice notes and stickers on a page', async () => {
  mockSocial.feed.mockResolvedValue({
    posts: [apiPost('p1', jun, { photos: [{ key: 'k', url: 'http://r2/get/k' }], voices: [{ key: 'v', seconds: 38, url: 'http://r2/get/v' }], stickers: ['cozy', 'calm'] })],
    nextBefore: null,
  });
  wrap();
  expect(await screen.findByLabelText('Photo')).toBeTruthy();
  expect(screen.getByText('0:38')).toBeTruthy();
  expect(screen.getByText('cozy, calm')).toBeTruthy();
  expect(screen.queryByLabelText('Remove voice note')).toBeNull(); // read-only in the feed
});

describe('friend requests', () => {
  beforeEach(() => { mockSocial.incoming.mockResolvedValue([sol]); });

  it('lists incoming requests on the Friends tab only', async () => {
    wrap();
    expect(await screen.findByText('Friend requests')).toBeTruthy();
    expect(screen.getByText('Sol Rivera')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Public' }));
    await screen.findByText('Pages anyone has made public. Tap a name to see more.');
    expect(screen.queryByText('Friend requests')).toBeNull();
  });

  it('accepting makes them a friend and refreshes the feed', async () => {
    wrap();
    await screen.findByText('Friend requests');
    await act(async () => { fireEvent.press(screen.getByRole('button', { name: 'Accept Sol' })); });
    expect(mockSocial.accept).toHaveBeenCalledWith(sol.id);
    expect(screen.queryByText('Friend requests')).toBeNull();
    expect(useToast.getState().message).toBe('You and Sol are now friends');
    await waitFor(() => expect(mockSocial.feed.mock.calls.length).toBeGreaterThan(1));
  });

  it('declining removes the request', async () => {
    wrap();
    await screen.findByText('Friend requests');
    await act(async () => { fireEvent.press(screen.getByRole('button', { name: 'Decline Sol' })); });
    expect(mockSocial.decline).toHaveBeenCalledWith(sol.id);
    expect(screen.queryByText('Friend requests')).toBeNull();
  });

  it('keeps the request and says so when the server refuses', async () => {
    mockSocial.accept.mockRejectedValueOnce(new Error('offline'));
    wrap();
    await screen.findByText('Friend requests');
    await act(async () => { fireEvent.press(screen.getByRole('button', { name: 'Accept Sol' })); });
    expect(screen.getByText('Friend requests')).toBeTruthy();
    expect(useToast.getState().message).toBe('Couldn’t update that. Try again.');
  });
});

describe('add a friend', () => {
  const id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';

  it('opens the profile from a pasted link', async () => {
    wrap();
    await screen.findByText('Jun Park');
    fireEvent.press(screen.getByRole('button', { name: 'Add a friend' }));
    fireEvent.changeText(screen.getByPlaceholderText('Paste a profile link'), `Add me on Journal: journal:///friends/${id}`);
    fireEvent.press(screen.getByRole('button', { name: 'Find' }));
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/friends/[id]', params: { id } });
  });

  it('explains when the text is not a profile link', async () => {
    wrap();
    await screen.findByText('Jun Park');
    fireEvent.press(screen.getByRole('button', { name: 'Add a friend' }));
    fireEvent.changeText(screen.getByPlaceholderText('Paste a profile link'), 'hello');
    fireEvent.press(screen.getByRole('button', { name: 'Find' }));
    expect(screen.getByText('That doesn’t look like a profile link.')).toBeTruthy();
    expect(mockPush).not.toHaveBeenCalled();
  });
});
