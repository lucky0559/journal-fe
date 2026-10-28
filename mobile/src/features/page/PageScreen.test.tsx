import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PageScreen } from './PageScreen';

const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockSetParams = jest.fn();
let mockCanGoBack = true;
let mockParams: Record<string, string> = {};

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack, replace: mockReplace, push: mockPush, setParams: mockSetParams, canGoBack: () => mockCanGoBack }),
  useLocalSearchParams: () => mockParams,
}));
jest.mock('@/state', () => {
  const { create } = require('zustand');
  const { demoEntries } = require('@/domain/demoData');
  const { sortEntries } = require('@/state/entriesStore');
  return { useEntries: create(() => ({ entries: sortEntries(demoEntries('2026-10-08')) })) };
});

// demo pages, newest first: demo-1 (7 Oct) ... demo-8 (20 Sep)
const wrap = () =>
  render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 360, height: 800 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <PageScreen />
    </SafeAreaProvider>,
  );

beforeEach(() => {
  jest.clearAllMocks();
  mockCanGoBack = true;
  mockParams = { id: 'demo-1' };
});

describe('reading a page', () => {
  it('shows the date like a journal heading, with the time', () => {
    wrap();
    expect(screen.getByText('WEDNESDAY'.toLowerCase().replace(/^./, (c) => c.toUpperCase()))).toBeTruthy();
    expect(screen.getByText('7 October')).toBeTruthy();
    expect(screen.getByText('2026 · 10:02 pm')).toBeTruthy();
    expect(screen.getByText('Page 8 of 8')).toBeTruthy();
  });

  it('shows the mood, the prompt and your words', () => {
    wrap();
    expect(screen.getByText('Good')).toBeTruthy();
    expect(screen.getByText('Nice. Hold onto it')).toBeTruthy();
    expect(screen.getByText('“Who did you feel close to today?”')).toBeTruthy();
    expect(screen.getByText(/Made pasta with Jun/)).toBeTruthy();
  });

  it('shows the photos, stickers and who can read the page', () => {
    wrap();
    expect(screen.getByText('photo · dinner')).toBeTruthy(); // the demo photo has no file, so its label shows
    expect(screen.getByText('cozy')).toBeTruthy();
    expect(screen.getByLabelText(/^Friends\./)).toBeTruthy();
  });

  it('plays voice notes and does not let you remove them while reading', () => {
    mockParams = { id: 'demo-2' };
    wrap();
    expect(screen.getByRole('button', { name: 'Play voice note' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Remove voice note' })).toBeNull();
    expect(screen.getByText('0:38')).toBeTruthy();
  });

  it('lists the feelings written with the page', () => {
    mockParams = { id: 'demo-1' };
    wrap();
    expect(screen.queryByText('Prompt')).toBeTruthy();
    // demo pages have no feelings: none are shown
    expect(screen.queryByText('grateful')).toBeNull();
  });

  it('has no editing controls on the page itself', () => {
    wrap();
    expect(screen.queryByPlaceholderText(/Start anywhere/)).toBeNull();
    expect(screen.queryByRole('button', { name: /Remove/ })).toBeNull();
  });
});

describe('moving around the journal', () => {
  it('edits through the Edit button', () => {
    wrap();
    fireEvent.press(screen.getByText('Edit'));
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/write', params: { entryId: 'demo-1' } });
  });

  it('turns to the older and newer pages, remembering which way it turned', () => {
    mockParams = { id: 'demo-3' };
    wrap();
    fireEvent.press(screen.getByRole('button', { name: /^Older page, / }));
    expect(mockSetParams).toHaveBeenLastCalledWith({ id: 'demo-4', dir: 'older' });
    fireEvent.press(screen.getByRole('button', { name: /^Newer page, / }));
    expect(mockSetParams).toHaveBeenLastCalledWith({ id: 'demo-2', dir: 'newer' });
  });

  it('has no newer page after the latest one and no older page before the first', () => {
    mockParams = { id: 'demo-1' };
    const latest = wrap();
    expect(screen.queryByRole('button', { name: /^Newer page/ })).toBeNull();
    expect(screen.getByRole('button', { name: /^Older page/ })).toBeTruthy();
    latest.unmount();
    mockParams = { id: 'demo-8' };
    wrap();
    expect(screen.queryByRole('button', { name: /^Older page/ })).toBeNull();
    expect(screen.getByText('Page 1 of 8')).toBeTruthy();
  });

  it('goes back, or to the tabs when there is nowhere to go back to', () => {
    wrap();
    fireEvent.press(screen.getByRole('button', { name: 'Back' }));
    expect(mockBack).toHaveBeenCalled();
    mockCanGoBack = false;
    fireEvent.press(screen.getByRole('button', { name: 'Back' }));
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
  });
});

describe('a page that is not there', () => {
  it('says so kindly and offers a way back', () => {
    mockParams = { id: 'deleted' };
    wrap();
    expect(screen.getByText('This page isn’t here any more.')).toBeTruthy();
    fireEvent.press(screen.getByText('Back to your pages'));
    expect(mockBack).toHaveBeenCalled();
  });
});
