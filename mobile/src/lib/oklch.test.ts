import { mixOklch, rgbToOklab, hexToRgb } from './oklch';

describe('mixOklch', () => {
  const sage = '#728157';
  const terracotta = '#d67f48';

  it('returns the endpoints exactly', () => {
    expect(mixOklch(sage, terracotta, 0)).toBe(sage);
    expect(mixOklch(sage, terracotta, 1)).toBe(terracotta);
  });

  it('always returns a lowercase 6-digit hex', () => {
    for (const t of [0.07, 0.25, 0.5, 0.73, 0.99]) {
      expect(mixOklch(sage, terracotta, t)).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it('interpolates lightness between the endpoints', () => {
    const [l0] = rgbToOklab(hexToRgb(sage));
    const [l1] = rgbToOklab(hexToRgb(terracotta));
    const [lm] = rgbToOklab(hexToRgb(mixOklch(sage, terracotta, 0.5)));
    expect(lm).toBeGreaterThan(Math.min(l0, l1) - 0.02);
    expect(lm).toBeLessThan(Math.max(l0, l1) + 0.02);
  });

  it('clamps t outside 0..1', () => {
    expect(mixOklch(sage, terracotta, -3)).toBe(sage);
    expect(mixOklch(sage, terracotta, 7)).toBe(terracotta);
  });
});
