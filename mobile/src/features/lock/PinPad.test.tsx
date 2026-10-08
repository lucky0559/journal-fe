import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PinPad } from './PinPad';

const wrap = (ui: React.ReactElement) =>
  render(<SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 360, height: 800 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>{ui}</SafeAreaProvider>);
const tap = (d: string) => fireEvent.press(screen.getByText(d));
const type = (s: string) => [...s].forEach(tap);
const tick = async () => { await act(async () => { jest.advanceTimersByTime(250); }); };

it('set flow: choose, confirm, complete', async () => {
  const onSetComplete = jest.fn();
  wrap(<PinPad mode="set" name="Maya" onSetComplete={onSetComplete} onCancel={() => {}} />);
  expect(screen.getByText('Choose a PIN')).toBeTruthy();
  type('1234'); await tick();
  expect(screen.getByText('Once more')).toBeTruthy();
  type('1234'); await tick();
  expect(onSetComplete).toHaveBeenCalledWith('1234');
});

it('set flow: a mismatch restarts with a message', async () => {
  wrap(<PinPad mode="set" name="Maya" onSetComplete={jest.fn()} onCancel={() => {}} />);
  type('1234'); await tick();
  type('1111'); await tick();
  expect(screen.getByText('Those didn’t match. Start again.')).toBeTruthy();
  expect(screen.getByText('Choose a PIN')).toBeTruthy();
});

it('unlock flow: wrong PIN shows the error, right PIN unlocks', async () => {
  const verify = jest.fn(async (p: string) => p === '2468');
  const onUnlocked = jest.fn();
  wrap(<PinPad mode="unlock" name="Maya" verify={verify} onUnlocked={onUnlocked} />);
  expect(screen.getByText('Welcome back, Maya.')).toBeTruthy();
  type('1111'); await tick();
  expect(screen.getByText('That’s not it. Try again.')).toBeTruthy();
  expect(onUnlocked).not.toHaveBeenCalled();
  type('2468'); await tick();
  expect(onUnlocked).toHaveBeenCalledTimes(1);
});

it('does not verify while fewer than four digits are entered, and backspace works', async () => {
  const verify = jest.fn(async () => false);
  wrap(<PinPad mode="unlock" name="" verify={verify} />);
  type('12'); await tick();
  expect(verify).not.toHaveBeenCalled();
  fireEvent.press(screen.getByLabelText('Delete'));
  fireEvent.press(screen.getByLabelText('Delete'));
  fireEvent.press(screen.getByLabelText('Delete'));
  type('1234'); await tick();
  expect(verify).toHaveBeenCalledTimes(1);
  expect(verify).toHaveBeenCalledWith('1234');
});

it('offers Cancel only while setting a PIN', () => {
  const onCancel = jest.fn();
  const { unmount } = wrap(<PinPad mode="set" name="" onCancel={onCancel} onSetComplete={jest.fn()} />);
  fireEvent.press(screen.getByText('Cancel'));
  expect(onCancel).toHaveBeenCalled();
  unmount();
  wrap(<PinPad mode="unlock" name="" verify={async () => false} />);
  expect(screen.queryByText('Cancel')).toBeNull();
});

it('tries biometrics once on mount in unlock mode', async () => {
  const biometric = jest.fn(async () => true);
  const onUnlocked = jest.fn();
  wrap(<PinPad mode="unlock" name="" verify={async () => false} biometric={biometric} onUnlocked={onUnlocked} />);
  await act(async () => {});
  expect(biometric).toHaveBeenCalledTimes(1);
  expect(onUnlocked).toHaveBeenCalledTimes(1);
});
