import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ApiError } from '@/api/client';
import { apiPost, jun } from '../../../test/fixtures';
import { useToast } from '@/state/toastStore';
import { PostScreen } from './PostScreen';
import { UPDATE_FAILED } from './useIncomingRequests';

const mockBack = jest.fn();
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockSocial = { post: jest.fn(), react: jest.fn(), unreact: jest.fn() };
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack, push: mockPush, replace: mockReplace, canGoBack: () => true }),
  useLocalSearchParams: () => ({ id: 'p1' }),
}));
jest.mock('@/social', () => ({ social: new Proxy({}, { get: (_t, k: string) => (...a: unknown[]) => (mockSocial as Record<string, (...x: unknown[]) => unknown>)[k](...a) }) }));

const wrap = () =>
  render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 360, height: 800 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <PostScreen />
    </SafeAreaProvider>,
  );

const post = (over = {}) => apiPost('p1', jun, { prompt: 'Who did you feel close to today?', stickers: ['calm'], ...over });

beforeEach(() => {
  jest.clearAllMocks();
  useToast.setState({ message: '' });
  mockSocial.post.mockResolvedValue(post());
  mockSocial.react.mockResolvedValue(undefined);
  mockSocial.unreact.mockResolvedValue(undefined);
});

it('opens the page like a journal page: who wrote it, when, what they wrote and who can read it', async () => {
  wrap();
  expect(await screen.findByText('text of p1')).toBeTruthy();
  expect(mockSocial.post).toHaveBeenCalledWith('p1');
  expect(screen.getByText('Jun Park')).toBeTruthy();
  expect(screen.getByText('8 October')).toBeTruthy();
  expect(screen.getByText(/Who did you feel close to today\?/)).toBeTruthy();
  expect(screen.getByText('calm')).toBeTruthy();
  expect(screen.getByText('Friends')).toBeTruthy();
});

it('never shows a mood or feelings, which only the author sees', async () => {
  wrap();
  await screen.findByText('text of p1');
  expect(screen.queryByText('Heavy')).toBeNull();
  expect(screen.queryByText('Bright')).toBeNull();
  expect(screen.queryByRole('button', { name: 'Edit' })).toBeNull();
});

it('goes to the author’s profile from their name', async () => {
  wrap();
  fireEvent.press(await screen.findByRole('button', { name: /Jun Park/ }));
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/friends/[id]', params: { id: jun.id } });
});

it('goes back', async () => {
  wrap();
  await screen.findByText('text of p1');
  fireEvent.press(screen.getByRole('button', { name: 'Back' }));
  expect(mockBack).toHaveBeenCalled();
});

it('reacts and takes the reaction back, showing the count straight away', async () => {
  wrap();
  await screen.findByText('text of p1');
  expect(screen.getByRole('button', { name: 'Sending a hug · 2' })).not.toBeSelected();
  await act(async () => { fireEvent.press(screen.getByRole('button', { name: 'Sending a hug · 2' })); });
  expect(mockSocial.react).toHaveBeenCalledWith('p1', 'hug');
  expect(screen.getByRole('button', { name: 'Sending a hug · 3' })).toBeSelected();
  await act(async () => { fireEvent.press(screen.getByRole('button', { name: 'Sending a hug · 3' })); });
  expect(mockSocial.unreact).toHaveBeenCalledWith('p1', 'hug');
  expect(screen.getByRole('button', { name: 'Sending a hug · 2' })).not.toBeSelected();
});

it('puts the count back and says so when a reaction fails', async () => {
  mockSocial.react.mockRejectedValue(new Error('offline'));
  wrap();
  await screen.findByText('text of p1');
  await act(async () => { fireEvent.press(screen.getByRole('button', { name: 'Same · 1' })); });
  expect(screen.getByRole('button', { name: 'Same · 1' })).not.toBeSelected();
  expect(useToast.getState().message).toBe(UPDATE_FAILED);
});

it('says so, with a way back, when the page is gone or not yours to read', async () => {
  mockSocial.post.mockRejectedValue(new ApiError(404, {}));
  wrap();
  expect(await screen.findByText('This page isn’t available.')).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: 'Back to the feed' }));
  expect(mockBack).toHaveBeenCalled();
});

it('offers a retry when the page fails to load', async () => {
  mockSocial.post.mockRejectedValueOnce(new Error('offline'));
  wrap();
  expect(await screen.findByText('Couldn’t load this page.')).toBeTruthy();
  await act(async () => { fireEvent.press(screen.getByRole('button', { name: 'Try again' })); });
  expect(await screen.findByText('text of p1')).toBeTruthy();
  expect(mockSocial.post).toHaveBeenCalledTimes(2);
});
