import { renderHook } from '@testing-library/react-native';
import { useAuth } from '@/auth';
import { useSignedOutRedirect } from './useSignedOutRedirect';

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ replace: mockReplace }), usePathname: () => mockPath.current }));
const mockPath = { current: '/' };

beforeEach(() => { jest.clearAllMocks(); mockPath.current = '/'; useAuth.setState({ status: 'signedIn' }); });

it('sends a user whose session ended to the login screen', () => {
  const { rerender } = renderHook(() => useSignedOutRedirect());
  expect(mockReplace).not.toHaveBeenCalled();
  useAuth.setState({ status: 'signedOut' });
  rerender({});
  expect(mockReplace).toHaveBeenCalledWith('/login');
});

it('does nothing while already on the login screen or still restoring', () => {
  mockPath.current = '/login';
  useAuth.setState({ status: 'signedOut' });
  renderHook(() => useSignedOutRedirect());
  expect(mockReplace).not.toHaveBeenCalled();
  mockPath.current = '/';
  useAuth.setState({ status: 'unknown' });
  renderHook(() => useSignedOutRedirect());
  expect(mockReplace).not.toHaveBeenCalled();
});
