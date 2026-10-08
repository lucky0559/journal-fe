import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LoginScreen } from './LoginScreen';
import { useAuth } from '@/auth';

const mockReplace = jest.fn();
const mockSignIn = jest.fn(async () => {});
jest.mock('expo-router', () => ({ useRouter: () => ({ replace: mockReplace }) }));

const wrap = () =>
  render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 360, height: 800 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <LoginScreen />
    </SafeAreaProvider>,
  );

beforeEach(() => {
  jest.clearAllMocks();
  useAuth.setState({ status: 'signedOut', user: null, token: null, busy: false, error: '', signIn: (() => mockSignIn()) as never });
});

it('offers Google sign-in and starts it on tap', () => {
  wrap();
  expect(screen.getByText('Welcome to your journal.')).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: 'Continue with Google' }));
  expect(mockSignIn).toHaveBeenCalledTimes(1);
});

it('shows a plain error message', () => {
  useAuth.setState({ error: 'Couldn’t sign in. Please try again.' });
  wrap();
  expect(screen.getByText('Couldn’t sign in. Please try again.')).toBeTruthy();
});

it('disables the button while signing in', () => {
  useAuth.setState({ busy: true });
  wrap();
  expect(screen.getByRole('button', { name: 'Continue with Google' })).toBeDisabled();
});

it('moves on to the start gate once signed in', () => {
  useAuth.setState({ status: 'signedIn' });
  wrap();
  expect(mockReplace).toHaveBeenCalledWith('/');
});
