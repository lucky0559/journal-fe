import { colors, ramp, radii, layout } from './tokens';

describe('tokens', () => {
  it('has the Lamplight base palette', () => {
    expect(colors).toMatchObject({
      bg: '#081a1c', surface: '#112527', text: '#f1ebdc',
      accent: '#eca338', accent2: '#5fb7a5', moodLow: '#7a77ba', moodHigh: '#f8ac3d',
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
