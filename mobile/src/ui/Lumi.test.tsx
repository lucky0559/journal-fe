import { render } from '@testing-library/react-native';
import { applyTheme } from '@/theme/tokens';
import { Lumi, Sparkle } from './Lumi';

afterEach(() => applyTheme('dark'));

it.each(['dark', 'light'] as const)('draws Lumi and a sparkle in the %s theme without text for screen readers to trip on', (theme) => {
  applyTheme(theme);
  const { toJSON, queryByText } = render(<><Lumi size={80} /><Lumi size={80} still /><Sparkle /></>);
  expect(toJSON()).toBeTruthy();
  expect(queryByText(/./)).toBeNull();
});
