import { MOOD_COLORS } from '@/lib/mood';
import { applyTheme, colors, ramp, type ThemeName } from './tokens';

/** WCAG 2.x contrast ratio between two colours (#rrggbb, or rgb(r, g, b) as the mood mixer returns). */
const channels = (c: string): number[] => (c.startsWith('#') ? [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16)) : (c.match(/\d+(\.\d+)?/g) ?? []).slice(0, 3).map(Number));
const luminance = (c: string) => {
  const [r, g, b] = channels(c).map((v) => v / 255).map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

// Every text pair the app uses must read comfortably in BOTH themes. The ramps run by emphasis, so these pairs are the
// contract. Each pair is read lazily because the colours change with the theme.
const TEXT_PAIRS: [string, () => [string, string]][] = [
  ['body text on the page', () => [colors.text, colors.bg]],
  ['body text on a panel', () => [colors.text, colors.surface]],
  ['secondary text on the page', () => [ramp.neutral[700], colors.bg]],
  ['secondary text on a panel', () => [ramp.neutral[700], colors.surface]],
  ['secondary text on a raised card', () => [ramp.neutral[700], ramp.neutral[100]]],
  ['placeholder text on the page', () => [ramp.neutral[500], colors.bg]],
  ['button text on the amber action', () => [colors.onAccent, colors.accent]],
  ['selected chip text on tide teal', () => [colors.onAccent, ramp.accent2[600]]],
  ['amber link text on the page', () => [ramp.accent[700], colors.bg]],
  ['ink on a tinted amber panel', () => [ramp.accent[900], ramp.accent[200]]],
  ['softer ink on a tinted amber panel', () => [ramp.accent[800], ramp.accent[200]]],
  ['ink on a tinted tide panel', () => [ramp.accent2[900], ramp.accent2[200]]],
  ['tag text on a tinted tide panel', () => [ramp.accent2[800], ramp.accent2[200]]],
  ['ink on the selected nav pill', () => [ramp.accent[900], ramp.accent[300]]],
  ['ink on a neutral card', () => [ramp.neutral[900], ramp.neutral[200]]],
  ['error and destructive text on the page', () => [colors.danger, colors.bg]],
  ['error text on a panel', () => [colors.danger, colors.surface]],
  ['error text on a raised card', () => [colors.danger, ramp.neutral[100]]],
  ['caption on a photo border', () => [colors.paperInk, colors.paper]],
  ['toast text on the toast', () => [colors.bg, ramp.neutral[900]]],
];

/** Dark numerals sit on the mood colours; light page needs deeper mood colours, so its numerals are held to the text bar. */
const NUMERALS: Record<ThemeName, { low: number; high: number }> = { dark: { low: 3.5, high: 7 }, light: { low: 4.5, high: 4.5 } };

for (const theme of ['dark', 'light'] as const) {
  describe(`${theme} palette contrast`, () => {
    beforeAll(() => { applyTheme(theme); });
    afterAll(() => { applyTheme('dark'); });

    it.each(TEXT_PAIRS)('%s is at least 4.5:1', (_name, pair) => {
      const [fg, bg] = pair();
      expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5);
    });

    it('keeps the mood colours visible against the page and a panel (3:1 for shapes)', () => {
      for (const c of [colors.moodLow, colors.moodHigh]) {
        expect(contrast(c, colors.bg)).toBeGreaterThanOrEqual(3);
        expect(contrast(c, colors.surface)).toBeGreaterThanOrEqual(3);
      }
    });

    it('keeps numerals readable on the ends of the mood scale', () => {
      expect(contrast(colors.onAccent, colors.moodLow)).toBeGreaterThanOrEqual(NUMERALS[theme].low);
      expect(contrast(colors.onAccent, colors.moodHigh)).toBeGreaterThanOrEqual(NUMERALS[theme].high);
    });

    it('keeps every mood on the way between them visible and readable', () => {
      const floor = Math.min(NUMERALS[theme].low, NUMERALS[theme].high);
      for (let v = 0; v <= 100; v += 5) {
        expect(contrast(colors.onAccent, MOOD_COLORS[v])).toBeGreaterThanOrEqual(floor);
        expect(contrast(MOOD_COLORS[v], colors.bg)).toBeGreaterThanOrEqual(3);
      }
    });
  });
}
