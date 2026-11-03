import { act, render, screen } from '@testing-library/react-native';
import { CountUp } from './CountUp';

const reanimated = require('react-native-reanimated');

afterEach(() => jest.restoreAllMocks());

it('shows the number at once when the phone asks for reduced motion', () => {
  render(<CountUp value={12} />);
  expect(screen.getByText('12')).toBeTruthy();
});

it('counts up from zero to the number otherwise', () => {
  jest.spyOn(reanimated, 'useReducedMotion').mockReturnValue(false);
  render(<CountUp value={12} />);
  expect(screen.getByText('0')).toBeTruthy();
  act(() => { jest.advanceTimersByTime(1000); });
  expect(screen.getByText('12')).toBeTruthy();
});

it('does not count when there is nothing to count', () => {
  jest.spyOn(reanimated, 'useReducedMotion').mockReturnValue(false);
  render(<CountUp value={0} />);
  expect(screen.getByText('0')).toBeTruthy();
});
