import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useSettings } from '@/state';
import { OnboardingScreen } from './OnboardingScreen';

const mockReplace = jest.fn();
const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ replace: mockReplace, push: mockPush }), useLocalSearchParams: () => ({}) }));
jest.mock('@/state', () => {
  const { create } = require('zustand');
  const update = jest.fn(async () => {});
  return {
    useSettings: Object.assign(
      create(() => ({ settings: { name: '', remind: true, remindTime: '9:00 pm', lockOn: false, onboarded: false }, update })),
      { __update: update },
    ),
  };
});

const update = (useSettings as unknown as { __update: jest.Mock }).__update;
const wrap = () =>
  render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 360, height: 800 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <OnboardingScreen />
    </SafeAreaProvider>,
  );

beforeEach(() => { jest.clearAllMocks(); });

it('walks through the steps and saves name and reminder time', async () => {
  wrap();
  expect(screen.getByText('A softer place to put your day.')).toBeTruthy();
  fireEvent.press(screen.getByText('Let’s begin'));

  expect(screen.getByText('What should we call you?')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();
  fireEvent.changeText(screen.getByPlaceholderText('Your first name'), '   ');
  expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();
  fireEvent.changeText(screen.getByPlaceholderText('Your first name'), ' Maya ');
  await act(async () => { fireEvent.press(screen.getByText('Continue')); });
  expect(update).toHaveBeenCalledWith({ name: 'Maya' });

  expect(screen.getByText('When do you usually wind down?')).toBeTruthy();
  fireEvent.press(screen.getByText('10:00 pm'));
  await act(async () => { fireEvent.press(screen.getByText('Continue')); });
  expect(update).toHaveBeenCalledWith({ remind: true, remindTime: '10:00 pm' });

  expect(screen.getByText('Keep your pages private?')).toBeTruthy();
  fireEvent.press(screen.getByText('Set a PIN'));
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/pin', params: { after: 'today' } });
});

it('"No reminders" turns the reminder off', async () => {
  wrap();
  fireEvent.press(screen.getByText('Let’s begin'));
  fireEvent.changeText(screen.getByPlaceholderText('Your first name'), 'Maya');
  await act(async () => { fireEvent.press(screen.getByText('Continue')); });
  fireEvent.press(screen.getByText('No reminders'));
  await act(async () => { fireEvent.press(screen.getByText('Continue')); });
  expect(update).toHaveBeenCalledWith(expect.objectContaining({ remind: false }));
});

it('"Not now" finishes onboarding without a PIN', async () => {
  wrap();
  fireEvent.press(screen.getByText('Let’s begin'));
  fireEvent.changeText(screen.getByPlaceholderText('Your first name'), 'Maya');
  await act(async () => { fireEvent.press(screen.getByText('Continue')); });
  await act(async () => { fireEvent.press(screen.getByText('Continue')); });
  await act(async () => { fireEvent.press(screen.getByText('Not now')); });
  expect(update).toHaveBeenCalledWith({ onboarded: true });
  expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
});
