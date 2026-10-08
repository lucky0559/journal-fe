import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { demoEntries } from '@/domain/demoData';
import { useCheckin } from '@/state/checkinStore';
import { TodayScreen } from './TodayScreen';

const mockPush = jest.fn();
const mockNavigate = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush, navigate: mockNavigate }), usePathname: () => '/' }));
jest.mock('@/state', () => {
  const { create } = require('zustand');
  const { demoEntries } = require('@/domain/demoData');
  return {
    useSettings: create(() => ({ settings: { name: 'Maya', remind: true, remindTime: '9:00 pm', lockOn: false, onboarded: true } })),
    useEntries: create(() => ({ entries: demoEntries('2026-10-08') })),
  };
});

const wrap = () =>
  render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 360, height: 800 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <TodayScreen />
    </SafeAreaProvider>,
  );

beforeEach(() => { jest.clearAllMocks(); useCheckin.setState({ mood: 62, feelings: [] }); });

it('greets by name and shows the check-in, prompts and the two latest pages', () => {
  wrap();
  expect(screen.getByText(/, Maya\.$/)).toBeTruthy();
  expect(screen.getByText('How are you arriving?')).toBeTruthy();
  expect(screen.getByText('Good')).toBeTruthy();
  expect(screen.getByText('Nice. Hold onto it')).toBeTruthy();
  expect(screen.getByText('Tonight’s prompts')).toBeTruthy();
  expect(screen.getByText('Wed, 7 Oct · Good')).toBeTruthy();
  expect(screen.getByText('Tue, 6 Oct · Low')).toBeTruthy();
  expect(screen.queryByText('Mon, 5 Oct · Okay')).toBeNull(); // only the two latest pages
});

it('toggles feeling chips', () => {
  wrap();
  fireEvent.press(screen.getByRole('button', { name: 'tired' }));
  expect(useCheckin.getState().feelings).toEqual(['tired']);
  fireEvent.press(screen.getByRole('button', { name: 'tired' }));
  expect(useCheckin.getState().feelings).toEqual([]);
});

it('starts a page from the top prompt card', () => {
  wrap();
  const buttons = screen.getAllByText('Write this');
  fireEvent.press(buttons[buttons.length - 1]); // cards are painted back to front, so the top card is last
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/write', params: { prompt: expect.any(String) } });
});

it('"See all" opens the Timeline in list mode', () => {
  wrap();
  fireEvent.press(screen.getByText('See all'));
  expect(mockNavigate).toHaveBeenCalledWith('/timeline');
});

it('opens a recent page for editing', () => {
  wrap();
  fireEvent.press(screen.getAllByRole('button', { name: /Made pasta|Presentation/ })[0]);
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/write', params: { entryId: expect.any(String) } });
});
