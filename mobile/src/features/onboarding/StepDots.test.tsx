import { render, screen } from '@testing-library/react-native';
import { StepDots } from './StepDots';

describe('StepDots', () => {
  it('announces the step to screen readers and follows it forward and back', () => {
    const { rerender } = render(<StepDots count={4} step={0} />);
    expect(screen.getByRole('progressbar', { name: 'Step 1 of 4' })).toBeTruthy();
    expect(screen.getByRole('progressbar').props.accessibilityValue).toEqual({ min: 1, max: 4, now: 1 });

    rerender(<StepDots count={4} step={2} />);
    expect(screen.getByRole('progressbar', { name: 'Step 3 of 4' })).toBeTruthy();

    rerender(<StepDots count={4} step={1} />);
    expect(screen.getByRole('progressbar').props.accessibilityValue).toEqual({ min: 1, max: 4, now: 2 });
  });
});
