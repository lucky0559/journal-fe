import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ana, jun } from '../../../test/fixtures';
import { FriendsListScreen } from './FriendsListScreen';

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockSocial = { friends: jest.fn() };
jest.mock('expo-router', () => {
  const React = require('react');
  return { useRouter: () => ({ push: mockPush, back: mockBack }), useFocusEffect: (cb: () => void) => React.useEffect(cb, []) };
});
jest.mock('@/social', () => ({ social: new Proxy({}, { get: (_t, k: string) => (...a: unknown[]) => (mockSocial as Record<string, (...x: unknown[]) => unknown>)[k](...a) }) }));

const wrap = () =>
  render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 360, height: 800 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <FriendsListScreen />
    </SafeAreaProvider>,
  );

beforeEach(() => {
  jest.clearAllMocks();
  mockSocial.friends.mockResolvedValue([jun, ana]);
});

it('lists every friend with a count and opens a profile on tap', async () => {
  wrap();
  expect(await screen.findByText('Jun Park')).toBeTruthy();
  expect(screen.getByText('Ana Reyes')).toBeTruthy();
  expect(screen.getByText('2 friends')).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: 'Jun Park, profile' }));
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/friends/[id]', params: { id: jun.id } });
});

it('says so when there are no friends yet', async () => {
  mockSocial.friends.mockResolvedValue([]);
  wrap();
  expect(await screen.findByText('No friends yet. Use “Add a friend” with their profile link.')).toBeTruthy();
});

it('offers a retry when the list cannot load', async () => {
  mockSocial.friends.mockRejectedValueOnce(new Error('offline'));
  wrap();
  expect(await screen.findByText('Couldn’t load your friends.')).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
  expect(await screen.findByText('Jun Park')).toBeTruthy();
});

it('goes back to the feed', async () => {
  wrap();
  await screen.findByText('Jun Park');
  fireEvent.press(screen.getByRole('button', { name: 'Back' }));
  expect(mockBack).toHaveBeenCalled();
});
