import { useToast } from './toastStore';

afterEach(() => { jest.clearAllTimers(); useToast.setState({ message: '' }); });

it('shows a message and clears it after 1.9s', () => {
  useToast.getState().show('Saved');
  expect(useToast.getState().message).toBe('Saved');
  jest.advanceTimersByTime(1899);
  expect(useToast.getState().message).toBe('Saved');
  jest.advanceTimersByTime(2);
  expect(useToast.getState().message).toBe('');
});

it('a newer toast restarts the timer', () => {
  useToast.getState().show('one');
  jest.advanceTimersByTime(1500);
  useToast.getState().show('two');
  jest.advanceTimersByTime(1500);
  expect(useToast.getState().message).toBe('two');
});
