import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useSocial } from '@/state/socialStore';
import { useToast } from '@/state/toastStore';
import { ProfileScreen } from './ProfileScreen';

const mockBack = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn(), back: mockBack }) }));

const wrap = (id: string) =>
  render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 360, height: 800 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <ProfileScreen personId={id} />
    </SafeAreaProvider>,
  );

beforeEach(() => { jest.clearAllMocks(); useSocial.setState({ overrides: {}, reacts: {} }); useToast.setState({ message: '' }); });

it('a non-friend sees public pages and can send, then cancel, a request', () => {
  wrap('sol');
  expect(screen.getByText('Sol Rivera')).toBeTruthy();
  expect(screen.getByText('Writing one line a day since June.')).toBeTruthy();
  expect(screen.getByText('2 pages you can read')).toBeTruthy();
  expect(screen.queryByText(/for friends only/)).toBeNull();
  fireEvent.press(screen.getByText('Add friend'));
  expect(screen.getByText('Request sent')).toBeTruthy();
  expect(useToast.getState().message).toBe('Friend request sent to Sol Rivera');
  fireEvent.press(screen.getByText('Request sent'));
  expect(screen.getByText('Add friend')).toBeTruthy();
});

it('a friend sees everything', () => {
  wrap('jun');
  expect(screen.getByRole('button', { name: 'Friends' })).toBeTruthy();
  expect(screen.getByText('2 pages you can read')).toBeTruthy();
});

it('hides friends-only pages from non-friends and says how many', () => {
  useSocial.setState({ overrides: { jun: 'none' } });
  wrap('jun');
  expect(screen.getByText('0 pages you can read')).toBeTruthy();
  expect(screen.getByText('2 more pages are for friends only.')).toBeTruthy();
});

it('goes back', () => {
  wrap('sol');
  fireEvent.press(screen.getByLabelText('Back'));
  expect(mockBack).toHaveBeenCalled();
});

it('shows a plain message for an unknown profile', () => {
  wrap('nobody');
  expect(screen.getByText('We couldn’t find that profile.')).toBeTruthy();
});
