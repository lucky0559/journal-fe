import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { ApiNotification } from '@/api/types';
import { useNotifications } from '@/state/notificationsStore';
import { NotificationsScreen } from './NotificationsScreen';

const mockBack = jest.fn();
const mockPush = jest.fn();
const mockSocial = { notifications: jest.fn(), markNotificationsRead: jest.fn(), unreadNotifications: jest.fn() };
jest.mock('expo-router', () => ({ useRouter: () => ({ back: mockBack, push: mockPush, replace: jest.fn(), canGoBack: () => true }) }));
jest.mock('@/social', () => ({ social: new Proxy({}, { get: (_t, k: string) => (...a: unknown[]) => (mockSocial as Record<string, (...x: unknown[]) => unknown>)[k](...a) }) }));

const wrap = () =>
  render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 360, height: 800 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <NotificationsScreen />
    </SafeAreaProvider>,
  );

const jun = { id: 'u-jun', name: 'Jun Park', givenName: 'Jun', photo: null };
const ana = { id: 'u-ana', name: 'Ana Reyes', givenName: 'Ana', photo: null };
const item = (over: Partial<ApiNotification>): ApiNotification => ({
  id: 'n1', kind: 'friend_request', actor: jun, postId: null, reaction: null, read: false, createdAt: new Date().toISOString(), ...over,
});

beforeEach(() => {
  jest.clearAllMocks();
  useNotifications.setState({ unread: 2 });
  mockSocial.markNotificationsRead.mockResolvedValue(undefined);
});

it('lists what happened, newest first as the server sends it, and marks everything read', async () => {
  mockSocial.notifications.mockResolvedValue({
    unread: 2,
    items: [item({ id: 'n1' }), item({ id: 'n2', kind: 'reaction', actor: ana, postId: 'p9', reaction: 'hug', read: false }), item({ id: 'n3', kind: 'friend_accepted', read: true })],
  });
  wrap();
  expect(await screen.findByText('Jun sent you a friend request')).toBeTruthy();
  expect(screen.getByText('Ana sent a hug to your page')).toBeTruthy();
  expect(screen.getByText('Jun accepted your friend request')).toBeTruthy();
  expect(mockSocial.markNotificationsRead).toHaveBeenCalledTimes(1);
  expect(useNotifications.getState().unread).toBe(0);
  expect(screen.getByRole('button', { name: /^New\. Jun sent you a friend request/ })).toBeTruthy(); // still marked while you look
});

it('does not mark anything read when everything is already read', async () => {
  mockSocial.notifications.mockResolvedValue({ unread: 0, items: [item({ read: true })] });
  wrap();
  await screen.findByText('Jun sent you a friend request');
  expect(mockSocial.markNotificationsRead).not.toHaveBeenCalled();
});

it('opens a friend’s profile for requests, and your page for a reaction', async () => {
  mockSocial.notifications.mockResolvedValue({
    unread: 0,
    items: [item({ id: 'n1', read: true }), item({ id: 'n2', kind: 'reaction', actor: ana, postId: 'p9', reaction: 'same', read: true })],
  });
  wrap();
  fireEvent.press(await screen.findByRole('button', { name: /Jun sent you a friend request/ }));
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/friends/[id]', params: { id: 'u-jun' } });
  fireEvent.press(screen.getByRole('button', { name: /Ana said “Same” on your page/ }));
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/page/[id]', params: { id: 'p9' } });
});

it('says so when there is nothing yet', async () => {
  mockSocial.notifications.mockResolvedValue({ unread: 0, items: [] });
  wrap();
  expect(await screen.findByText(/Nothing new yet/)).toBeTruthy();
});

it('offers a retry when loading fails, and goes back', async () => {
  mockSocial.notifications.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({ unread: 0, items: [item({ read: true })] });
  wrap();
  expect(await screen.findByText('Couldn’t load your notifications.')).toBeTruthy();
  await act(async () => { fireEvent.press(screen.getByRole('button', { name: 'Try again' })); });
  expect(await screen.findByText('Jun sent you a friend request')).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: 'Back' }));
  expect(mockBack).toHaveBeenCalled();
});
