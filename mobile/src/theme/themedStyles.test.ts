import { applyTheme, colors } from './tokens';
import { themedStyles } from './themedStyles';

afterEach(() => { applyTheme('dark'); });

describe('themedStyles', () => {
  const make = (factory = jest.fn(() => ({ box: { backgroundColor: colors.bg } }))) => ({ factory, get: themedStyles(factory) });

  it('builds the sheet with the colours that are live when it is first asked for', () => {
    const { get } = make();
    expect(get().box.backgroundColor).toBe('#081a1c');
  });

  it('reuses the sheet until the theme changes', () => {
    const { factory, get } = make();
    expect(get()).toBe(get());
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it('rebuilds with the new colours after a theme change, and again after changing back', () => {
    const { factory, get } = make();
    get();
    applyTheme('light');
    expect(get().box.backgroundColor).toBe('#f8e7d0');
    applyTheme('dark');
    expect(get().box.backgroundColor).toBe('#081a1c');
    expect(factory).toHaveBeenCalledTimes(3);
  });
});
