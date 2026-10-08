import { fireEvent, render, screen } from '@testing-library/react-native';
import { MoodSlider } from './MoodSlider';

const adjust = (name: 'increment' | 'decrement') =>
  fireEvent(screen.getByRole('adjustable'), 'accessibilityAction', { nativeEvent: { actionName: name } });

it('exposes the current value to screen readers', () => {
  render(<MoodSlider value={62} onChange={() => {}} />);
  expect(screen.getByRole('adjustable')).toHaveAccessibilityValue({ min: 0, max: 100, now: 62 });
});

it('steps by 5 with accessibility actions and stays within 0-100', () => {
  const onChange = jest.fn();
  const { rerender } = render(<MoodSlider value={62} onChange={onChange} />);
  adjust('increment');
  expect(onChange).toHaveBeenLastCalledWith(67);
  adjust('decrement');
  expect(onChange).toHaveBeenLastCalledWith(57);
  rerender(<MoodSlider value={98} onChange={onChange} />);
  adjust('increment');
  expect(onChange).toHaveBeenLastCalledWith(100);
  rerender(<MoodSlider value={2} onChange={onChange} />);
  adjust('decrement');
  expect(onChange).toHaveBeenLastCalledWith(0);
});
