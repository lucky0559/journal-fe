import { fireEvent, render, screen } from '@testing-library/react-native';
import { Button } from './Button';

it('calls onPress', () => {
  const onPress = jest.fn();
  render(<Button label="Continue" onPress={onPress} />);
  fireEvent.press(screen.getByText('Continue'));
  expect(onPress).toHaveBeenCalledTimes(1);
});

it('does not fire when disabled and reports the disabled state', () => {
  const onPress = jest.fn();
  render(<Button label="Continue" onPress={onPress} disabled />);
  fireEvent.press(screen.getByText('Continue'));
  expect(onPress).not.toHaveBeenCalled();
  expect(screen.getByRole('button')).toBeDisabled();
});
