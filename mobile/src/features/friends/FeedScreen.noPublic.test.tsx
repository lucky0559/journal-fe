import { render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { apiPost, jun } from '../../../test/fixtures';
import { FeedScreen } from './FeedScreen';
import { PUBLIC_FEED_ENABLED } from './publicFeed';

const mockSocial = { feed: jest.fn(), incoming: jest.fn(), react: jest.fn(), unreact: jest.fn() };
jest.mock('expo-router', () => {
  const React = require('react');
  return { useRouter: () => ({ push: jest.fn() }), useFocusEffect: (cb: () => void) => React.useEffect(cb, []) };
});
jest.mock('@/social', () => ({ social: new Proxy({}, { get: (_t, k: string) => (...a: unknown[]) => (mockSocial as Record<string, (...x: unknown[]) => unknown>)[k](...a) }) }));

it('ships with the Public tab off, showing only friends’ pages', async () => {
  expect(PUBLIC_FEED_ENABLED).toBe(false);
  mockSocial.feed.mockResolvedValue({ posts: [apiPost('p1', jun)], nextBefore: null });
  mockSocial.incoming.mockResolvedValue([]);
  render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 360, height: 800 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <FeedScreen />
    </SafeAreaProvider>,
  );
  expect(await screen.findByText('Jun Park')).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Public' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Friends' })).toBeNull();
  expect(mockSocial.feed).toHaveBeenCalledTimes(1);
  expect(mockSocial.feed).toHaveBeenCalledWith('friends', undefined);
});
