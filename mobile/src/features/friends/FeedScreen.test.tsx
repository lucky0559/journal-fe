import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useSocial } from '@/state/socialStore';
import { FeedScreen } from './FeedScreen';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush, back: jest.fn() }), usePathname: () => '/friends' }));

const wrap = () =>
  render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 360, height: 800 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <FeedScreen />
    </SafeAreaProvider>,
  );

beforeEach(() => { jest.clearAllMocks(); useSocial.setState({ overrides: {}, reacts: {} }); });

it('starts on Friends with the explanatory note and only friends’ posts', () => {
  wrap();
  expect(screen.getByText('Others’ pages')).toBeTruthy();
  expect(screen.getByText('Pages your friends chose to share with you.')).toBeTruthy();
  expect(screen.getAllByText('Jun')).toHaveLength(2);
  expect(screen.getByText('Ana')).toBeTruthy();
  expect(screen.queryByText('Kit')).toBeNull();
});

it('Public shows every public post, from anyone', () => {
  wrap();
  fireEvent.press(screen.getByRole('button', { name: 'Public' }));
  expect(screen.getByText('Pages anyone has made public. Tap a name to see more.')).toBeTruthy();
  expect(screen.getAllByText('Sol Rivera')).toHaveLength(2);
  expect(screen.getByText('Kit')).toBeTruthy();
  expect(screen.queryByText('Ana')).toBeNull();
});

it('toggles reactions and adjusts the counts', () => {
  wrap();
  fireEvent.press(screen.getByText('Sending a hug · 5'));
  expect(screen.getByText('Sending a hug · 6')).toBeTruthy();
  fireEvent.press(screen.getByText('Sending a hug · 6'));
  expect(screen.getByText('Sending a hug · 5')).toBeTruthy();
  fireEvent.press(screen.getByText('Same · 3'));
  expect(screen.getByText('Same · 4')).toBeTruthy();
});

it('opens a profile from the name', () => {
  wrap();
  fireEvent.press(screen.getAllByText('Ana')[0]);
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/friends/[id]', params: { id: 'ana' } });
});
