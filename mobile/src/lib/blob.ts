/** 8 percentages: horizontal radii TL,TR,BR,BL then vertical radii TL,TR,BR,BL. */
export type Radii = readonly [number, number, number, number, number, number, number, number];

export function parseRadii(css: string): Radii {
  const [h, v] = css.split('/').map((s) => s.trim());
  const expand = (s: string): number[] => {
    const n = s.split(/\s+/).map((x) => parseFloat(x));
    if (n.length === 1) return [n[0], n[0], n[0], n[0]];
    if (n.length === 2) return [n[0], n[1], n[0], n[1]];
    if (n.length === 3) return [n[0], n[1], n[2], n[1]];
    return n.slice(0, 4);
  };
  return [...expand(h), ...expand(v ?? h)] as unknown as Radii;
}

const r2 = (n: number) => +n.toFixed(2);

/** SVG path for a box with CSS-style elliptical corner radii. Overlapping radii scale down like CSS. */
export function blobPath(radii: Radii, w: number, h: number = w): string {
  const f = Math.min(1, 100 / (radii[0] + radii[1]), 100 / (radii[3] + radii[2]), 100 / (radii[4] + radii[7]), 100 / (radii[5] + radii[6]));
  const [htl, htr, hbr, hbl, vtl, vtr, vbr, vbl] = radii.map((x) => x * f);
  const X = (p: number) => r2((w * p) / 100);
  const Y = (p: number) => r2((h * p) / 100);
  const a = X(htl), b = X(htr), c = X(hbr), d = X(hbl);
  const e = Y(vtl), g = Y(vtr), i = Y(vbr), j = Y(vbl);
  return [
    `M${a},0`, `L${r2(w - b)},0`, `A${b},${g} 0 0 1 ${w},${g}`,
    `L${w},${r2(h - i)}`, `A${c},${i} 0 0 1 ${r2(w - c)},${h}`,
    `L${d},${h}`, `A${d},${j} 0 0 1 0,${r2(h - j)}`,
    `L0,${e}`, `A${a},${e} 0 0 1 ${a},0`, 'Z',
  ].join(' ');
}
