import { fireEvent, render, screen } from '@testing-library/react-native';
import type { Entry } from '@/domain/types';
import { EntryCard } from './EntryCard';

const entry = (over: Partial<Entry> = {}): Entry => ({
  id: 'a', createdAt: 1, date: '2026-10-03', time: '6:12 pm', mood: 84, feelings: [], text: 'Found a bench by the river.',
  prompt: '', vis: 'public', photos: [{ id: '1', uri: '' }, { id: '2', uri: '' }], voices: [], stickers: [], ...over,
});

it('shows date, mood, audience tag, text and media summary', () => {
  render(<EntryCard entry={entry()} onPress={() => {}} />);
  expect(screen.getByText('Sat, 3 Oct · Bright')).toBeTruthy();
  expect(screen.getByText('Public')).toBeTruthy();
  expect(screen.getByText('Found a bench by the river.')).toBeTruthy();
  expect(screen.getByText('2 photos')).toBeTruthy();
});

it('shows the clock time instead of the date in the day variant, and no tag for private pages', () => {
  render(<EntryCard entry={entry({ vis: 'private' })} variant="time" onPress={() => {}} />);
  expect(screen.getByText('6:12 pm · Bright')).toBeTruthy();
  expect(screen.queryByText('Public')).toBeNull();
});

it('says "No words, just moments." for a page with only a sticker', () => {
  render(<EntryCard entry={entry({ text: '', photos: [], stickers: ['calm'], vis: 'private' })} onPress={() => {}} />);
  expect(screen.getByText('No words, just moments.')).toBeTruthy();
  expect(screen.getByText('calm')).toBeTruthy();
});

it('opens on press and clamps long text to three lines by default', () => {
  const onPress = jest.fn();
  render(<EntryCard entry={entry({ text: 'x '.repeat(400) })} onPress={onPress} />);
  fireEvent.press(screen.getByRole('button'));
  expect(onPress).toHaveBeenCalled();
  expect(screen.getByTestId('entry-text').props.numberOfLines).toBe(3);
});
