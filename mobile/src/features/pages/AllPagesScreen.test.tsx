import { fireEvent, render, screen } from '@testing-library/react-native';
import { AllPagesScreen } from './AllPagesScreen';
import { useEntries } from '@/state';
import type { Entry } from '@/domain/types';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush, back: jest.fn(), canGoBack: () => true, replace: jest.fn() }) }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));

const e = (id: string, text: string, mood: number): Entry => ({
  id, createdAt: 0, date: '2026-10-08', time: '9:41 pm', mood, feelings: [], text, prompt: '', vis: 'private',
  photos: [], voices: [], stickers: [], publishedAt: null,
});

beforeEach(() => {
  mockPush.mockClear();
  useEntries.setState({ entries: [e('a', 'Made pasta with Jun', 70), e('b', 'Long quiet day', 10)], loaded: true });
});

it('lists every page and says how many there are', () => {
  render(<AllPagesScreen />);
  expect(screen.getByText('All your pages')).toBeTruthy();
  expect(screen.getByText('2 pages')).toBeTruthy();
  expect(screen.getByText('Made pasta with Jun')).toBeTruthy();
  expect(screen.getByText('Long quiet day')).toBeTruthy();
});

it('searches by words and says what is left', () => {
  render(<AllPagesScreen />);
  fireEvent.changeText(screen.getByLabelText('Search your pages'), 'pasta');
  expect(screen.getByText('Made pasta with Jun')).toBeTruthy();
  expect(screen.queryByText('Long quiet day')).toBeNull();
  expect(screen.getByText('1 of 2 pages')).toBeTruthy();
  fireEvent.changeText(screen.getByLabelText('Search your pages'), 'zzz');
  expect(screen.getByText('No pages match that.')).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: 'Clear search' }));
  expect(screen.getByText('Long quiet day')).toBeTruthy();
});

it('filters by mood, and a second tap on the same mood clears it', () => {
  render(<AllPagesScreen />);
  fireEvent.press(screen.getByRole('button', { name: 'Heavy' }));
  expect(screen.getByText('Long quiet day')).toBeTruthy();
  expect(screen.queryByText('Made pasta with Jun')).toBeNull();
  fireEvent.press(screen.getByRole('button', { name: 'Heavy' }));
  expect(screen.getByText('Made pasta with Jun')).toBeTruthy();
});

it('opens a page', () => {
  render(<AllPagesScreen />);
  fireEvent.press(screen.getByText('Long quiet day'));
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/page/[id]', params: { id: 'b' } });
});

it('says so when there are no pages yet', () => {
  useEntries.setState({ entries: [] });
  render(<AllPagesScreen />);
  expect(screen.getByText('No pages yet. Your first one is a tap away.')).toBeTruthy();
});
