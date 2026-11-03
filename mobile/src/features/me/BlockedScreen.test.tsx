import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { jun, ana } from '../../../test/fixtures';
import { useToast } from '@/state/toastStore';
import { BlockedScreen } from './BlockedScreen';

const mockBack = jest.fn();
const mockSocial = { blocked: jest.fn(), unblock: jest.fn() };
jest.mock('expo-router', () => ({ useRouter: () => ({ back: mockBack }) }));
jest.mock('@/social', () => ({ social: new Proxy({}, { get: (_t, k: string) => (...a: unknown[]) => (mockSocial as Record<string, (...x: unknown[]) => unknown>)[k](...a) }) }));

const wrap = () =>
  render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 360, height: 800 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <BlockedScreen />
    </SafeAreaProvider>,
  );

beforeEach(() => {
  jest.clearAllMocks();
  useToast.setState({ message: '' });
  mockSocial.unblock.mockResolvedValue(undefined);
});

it('lists the people you blocked and unblocks one', async () => {
  mockSocial.blocked.mockResolvedValue([jun, ana]);
  wrap();
  expect(await screen.findByText('Jun Park')).toBeTruthy();
  expect(screen.getByText('Ana Reyes')).toBeTruthy();
  await act(async () => { fireEvent.press(screen.getAllByRole('button', { name: 'Unblock' })[0]); });
  expect(mockSocial.unblock).toHaveBeenCalledWith(jun.id);
  expect(screen.queryByText('Jun Park')).toBeNull();
  expect(screen.getByText('Ana Reyes')).toBeTruthy();
  expect(useToast.getState().message).toBe('Jun Park is unblocked');
});

it('keeps the person in the list and says so when unblocking fails', async () => {
  mockSocial.blocked.mockResolvedValue([jun]);
  mockSocial.unblock.mockRejectedValue(new Error('offline'));
  wrap();
  await screen.findByText('Jun Park');
  await act(async () => { fireEvent.press(screen.getByRole('button', { name: 'Unblock' })); });
  expect(screen.getByText('Jun Park')).toBeTruthy();
  expect(useToast.getState().message).toBe('Couldn’t unblock them. Try again.');
});

it('says when nobody is blocked, and offers a retry on error', async () => {
  mockSocial.blocked.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce([]);
  wrap();
  expect(await screen.findByText('Couldn’t load this list.')).toBeTruthy();
  await act(async () => { fireEvent.press(screen.getByRole('button', { name: 'Try again' })); });
  expect(await screen.findByText('You haven’t blocked anyone.')).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: 'Back' }));
  expect(mockBack).toHaveBeenCalled();
});
