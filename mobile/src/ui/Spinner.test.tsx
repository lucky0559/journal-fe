import { fireEvent, render, screen } from '@testing-library/react-native';
import { applyTheme } from '@/theme/tokens';
import { Button } from './Button';
import { Loading } from './Loading';
import { Spinner } from './Spinner';

afterEach(() => applyTheme('dark'));

describe('Spinner', () => {
  it.each(['dark', 'light'] as const)('shows Lumi as a progress indicator with a spoken label in the %s theme', (theme) => {
    applyTheme(theme);
    render(<Spinner label="Opening the page" />);
    expect(screen.getByRole('progressbar', { name: 'Opening the page' })).toBeTruthy();
  });

  it('has no text on screen, and the label defaults to Loading', () => {
    render(<Spinner />);
    expect(screen.getByLabelText('Loading')).toBeTruthy();
    expect(screen.queryByText(/./)).toBeNull();
  });

  it('draws the small version for buttons without the shadow and sparkle', () => {
    const big = render(<Spinner size={64} />).toJSON();
    const small = render(<Spinner size={24} />).toJSON();
    expect(JSON.stringify(small).length).toBeLessThan(JSON.stringify(big).length);
  });
});

describe('Loading', () => {
  it('is Lumi with a label', () => {
    render(<Loading label="Looking for news" />);
    expect(screen.getByRole('progressbar', { name: 'Looking for news' })).toBeTruthy();
  });
});

describe('Button loading', () => {
  it('swaps the label for Lumi, keeps the button, and ignores presses', () => {
    const onPress = jest.fn();
    render(<Button label="Continue with Google" onPress={onPress} loading />);
    const button = screen.getByRole('button', { name: 'Continue with Google' });
    expect(button).toBeBusy();
    expect(button).toBeDisabled();
    expect(screen.getByRole('progressbar', { name: 'Continue with Google, please wait' })).toBeTruthy();
    fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('is an ordinary button when not loading', () => {
    const onPress = jest.fn();
    render(<Button label="Go" onPress={onPress} />);
    fireEvent.press(screen.getByRole('button', { name: 'Go' }));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('progressbar')).toBeNull();
  });
});
