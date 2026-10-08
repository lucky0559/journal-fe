export type Rgb = readonly [number, number, number];
export type Lab = readonly [number, number, number];

export const hexToRgb = (hex: string): Rgb => {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

const toLinear = (c: number) => {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const fromLinear = (l: number) => {
  const s = l <= 0.0031308 ? 12.92 * l : 1.055 * l ** (1 / 2.4) - 0.055;
  return Math.round(Math.min(1, Math.max(0, s)) * 255);
};

/** sRGB (0-255) -> OKLab, using Björn Ottosson's matrices. */
export function rgbToOklab([r, g, b]: Rgb): Lab {
  const lr = toLinear(r), lg = toLinear(g), lb = toLinear(b);
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

export function oklabToRgb([L, a, b]: Lab): Rgb {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    fromLinear(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    fromLinear(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    fromLinear(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ];
}

const toHex = ([r, g, b]: Rgb) => '#' + [r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('');

/**
 * CSS `color-mix(in oklch, to t%, from)`: lightness and chroma interpolate linearly,
 * hue takes the shorter arc. `t` is the fraction of `toHex_` (0..1).
 */
export function mixOklch(fromHex: string, toHex_: string, t: number): string {
  const k = Math.min(1, Math.max(0, t));
  if (k === 0) return fromHex.toLowerCase();
  if (k === 1) return toHex_.toLowerCase();
  const [L0, a0, b0] = rgbToOklab(hexToRgb(fromHex));
  const [L1, a1, b1] = rgbToOklab(hexToRgb(toHex_));
  const C0 = Math.hypot(a0, b0), C1 = Math.hypot(a1, b1);
  const h0 = Math.atan2(b0, a0), h1 = Math.atan2(b1, a1);
  let dh = h1 - h0;
  if (dh > Math.PI) dh -= 2 * Math.PI;
  if (dh < -Math.PI) dh += 2 * Math.PI;
  const L = L0 + (L1 - L0) * k;
  const C = C0 + (C1 - C0) * k;
  const h = h0 + dh * k;
  return toHex(oklabToRgb([L, C * Math.cos(h), C * Math.sin(h)]));
}
