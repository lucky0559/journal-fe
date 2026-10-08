import { parseRadii, blobPath } from './blob';

describe('blob', () => {
  it('parses a CSS elliptical radius string', () => {
    expect(parseRadii('58% 42% 38% 62% / 64% 46% 54% 36%')).toEqual([58, 42, 38, 62, 64, 46, 54, 36]);
  });

  it('treats a single value as a circle', () => {
    expect(parseRadii('50%')).toEqual([50, 50, 50, 50, 50, 50, 50, 50]);
  });

  it('draws a circle as four quarter arcs', () => {
    expect(blobPath([50, 50, 50, 50, 50, 50, 50, 50], 100)).toBe(
      'M50,0 L50,0 A50,50 0 0 1 100,50 L100,50 A50,50 0 0 1 50,100 L50,100 A50,50 0 0 1 0,50 L0,50 A50,50 0 0 1 50,0 Z',
    );
  });

  it('scales radii to the box size', () => {
    expect(blobPath([50, 50, 50, 50, 50, 50, 50, 50], 88)).toContain('M44,0');
  });

  it('shrinks radii that would overlap (CSS behaviour) instead of producing a broken path', () => {
    const p = blobPath([80, 80, 80, 80, 80, 80, 80, 80], 100);
    expect(p).not.toContain('NaN');
    expect(p).toContain('M50,0');
  });
});
