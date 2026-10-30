import { applyTheme, colors, getTheme, layout, onThemeChange, radii, ramp, shadows, statusBarStyle } from './tokens';

afterEach(() => { applyTheme('dark'); });

describe('tokens', () => {
  it('has the Lamplight base palette', () => {
    expect(colors).toMatchObject({
      bg: '#081a1c', surface: '#112527', text: '#f1ebdc',
      accent: '#eca338', accent2: '#5fb7a5', moodLow: '#7a77ba', moodHigh: '#f8ac3d', onAccent: '#081a1c',
    });
  });

  it('has complete 100-900 ramps', () => {
    for (const r of [ramp.accent, ramp.accent2, ramp.neutral]) {
      expect(Object.keys(r).map(Number)).toEqual([100, 200, 300, 400, 500, 600, 700, 800, 900]);
    }
    expect(ramp.accent[500]).toBe('#da942c');
    expect(ramp.accent2[600]).toBe('#5fb7a5');
    expect(ramp.neutral[300]).toBe('#304446');
  });

  it('exposes radii and layout constants', () => {
    expect(radii).toMatchObject({ pill: 999, card: 28, container: 32, sheet: 32, fab: 22 });
    expect(layout).toMatchObject({ screenPadding: 22, navHeight: 76, hitTarget: 44 });
  });
});

describe('themes', () => {
  it('starts dark', () => {
    expect(getTheme()).toBe('dark');
    expect(statusBarStyle()).toBe('light');
  });

  it('switches the live colours, ramps and shadows to Daylight and back', () => {
    const darkBg = colors.bg;
    const darkShadow = shadows.md.shadowOpacity;
    applyTheme('light');
    expect(getTheme()).toBe('light');
    expect(colors).toMatchObject({ bg: '#f8e7d0', surface: '#fdf6ea', text: '#381e20', onAccent: '#221012' });
    expect(ramp.neutral[900]).toBe('#381e20');
    expect(ramp.accent[200]).toBe('#ffe3b4');
    expect(shadows.md.shadowOpacity).toBeLessThan(darkShadow as number);
    expect(statusBarStyle()).toBe('dark');
    applyTheme('dark');
    expect(colors.bg).toBe(darkBg);
    expect(ramp.neutral[900]).toBe('#ede7db');
  });

  it('keeps the same objects, so every file that imported them sees the change', () => {
    const refs = { c: colors, a: ramp.accent, n: ramp.neutral, s: shadows };
    applyTheme('light');
    expect(colors).toBe(refs.c);
    expect(ramp.accent).toBe(refs.a);
    expect(ramp.neutral).toBe(refs.n);
    expect(shadows).toBe(refs.s);
  });

  it('gives both themes the same names, with both ramps complete', () => {
    const dark = { colors: Object.keys(colors), accent: Object.keys(ramp.accent), shadows: Object.keys(shadows) };
    applyTheme('light');
    expect(Object.keys(colors)).toEqual(dark.colors);
    expect(Object.keys(ramp.accent)).toEqual(dark.accent);
    expect(Object.keys(shadows)).toEqual(dark.shadows);
    for (const r of [ramp.accent, ramp.accent2, ramp.neutral]) expect(Object.keys(r).map(Number)).toEqual([100, 200, 300, 400, 500, 600, 700, 800, 900]);
  });

  it('treats anything it does not know as dark', () => {
    applyTheme('light');
    applyTheme('sepia');
    expect(getTheme()).toBe('dark');
    expect(colors.bg).toBe('#081a1c');
  });

  it('tells listeners once per real change, and not for a repeat', () => {
    const seen = jest.fn();
    const off = onThemeChange(seen);
    applyTheme('dark');
    expect(seen).not.toHaveBeenCalled();
    applyTheme('light');
    applyTheme('light');
    expect(seen).toHaveBeenCalledTimes(1);
    off();
    applyTheme('dark');
    expect(seen).toHaveBeenCalledTimes(1);
  });
});
