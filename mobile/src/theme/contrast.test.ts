import { colors, ramp } from './tokens';

/** WCAG 2.x contrast ratio between two #rrggbb colours. */
const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

// Every text pair the app uses must read comfortably. The ramps run by emphasis, so these pairs are the contract.
const TEXT_PAIRS: [string, string, string][] = [
  ['body text on the page', colors.text, colors.bg],
  ['body text on a panel', colors.text, colors.surface],
  ['secondary text on the page', ramp.neutral[700], colors.bg],
  ['secondary text on a panel', ramp.neutral[700], colors.surface],
  ['secondary text on a raised card', ramp.neutral[700], ramp.neutral[100]],
  ['placeholder text on the page', ramp.neutral[500], colors.bg],
  ['button text on the amber action', colors.bg, colors.accent],
  ['selected chip text on tide teal', ramp.neutral[100], ramp.accent2[600]],
  ['amber link text on the page', ramp.accent[700], colors.bg],
  ['ink on a tinted amber panel', ramp.accent[900], ramp.accent[200]],
  ['softer ink on a tinted amber panel', ramp.accent[800], ramp.accent[200]],
  ['ink on a tinted tide panel', ramp.accent2[900], ramp.accent2[200]],
  ['tag text on a tinted tide panel', ramp.accent2[800], ramp.accent2[200]],
  ['ink on the selected nav pill', ramp.accent[900], ramp.accent[300]],
  ['ink on a neutral card', ramp.neutral[900], ramp.neutral[200]],
  ['error and destructive text on the page', colors.danger, colors.bg],
  ['error text on a panel', colors.danger, colors.surface],
  ['error text on a raised card', colors.danger, ramp.neutral[100]],
  ['caption on a photo border', colors.paperInk, colors.paper],
  ['toast text on the toast', colors.bg, ramp.neutral[900]],
];

describe('palette contrast', () => {
  it.each(TEXT_PAIRS)('%s is at least 4.5:1', (_name, fg, bg) => {
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps the mood colours visible against the page (3:1 for shapes)', () => {
    expect(contrast(colors.moodLow, colors.bg)).toBeGreaterThanOrEqual(3);
    expect(contrast(colors.moodHigh, colors.bg)).toBeGreaterThanOrEqual(3);
  });

  it('keeps dark numerals readable on every mood colour in the calendar', () => {
    expect(contrast(colors.bg, colors.moodLow)).toBeGreaterThanOrEqual(3.5);
    expect(contrast(colors.bg, colors.moodHigh)).toBeGreaterThanOrEqual(7);
  });
});
