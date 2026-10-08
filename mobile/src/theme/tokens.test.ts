import { colors, ramp, radii, layout } from './tokens';

describe('tokens', () => {
  it('has the base palette from the design system', () => {
    expect(colors).toMatchObject({
      bg: '#f5ead8', surface: '#ebddc5', text: '#201e1d',
      accent: '#c67139', accent2: '#7a8a5e', divider: 'rgba(32,30,29,0.16)',
    });
  });

  it('has complete 100-900 ramps', () => {
    for (const r of [ramp.accent, ramp.accent2, ramp.neutral]) {
      expect(Object.keys(r).map(Number)).toEqual([100, 200, 300, 400, 500, 600, 700, 800, 900]);
    }
    expect(ramp.accent[500]).toBe('#d67f48');
    expect(ramp.accent2[600]).toBe('#728157');
    expect(ramp.neutral[300]).toBe('#dcd3c4');
  });

  it('exposes radii and layout constants', () => {
    expect(radii).toMatchObject({ pill: 999, card: 28, container: 32, sheet: 32, fab: 22 });
    expect(layout).toMatchObject({ screenPadding: 22, navHeight: 76, hitTarget: 44 });
  });
});
