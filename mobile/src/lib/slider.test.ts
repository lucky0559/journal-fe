import { positionFromX, valueFromX } from './slider';

describe('positionFromX', () => {
  it('keeps the fraction so the thumb can move smoothly', () => {
    expect(positionFromX(67, 200)).toBeCloseTo(33.5);
    expect(positionFromX(-5, 200)).toBe(0);
    expect(positionFromX(500, 200)).toBe(100);
    expect(positionFromX(10, 0)).toBe(0);
  });
});

describe('valueFromX', () => {
  it('maps position to a rounded 0-100 value', () => {
    expect(valueFromX(0, 200)).toBe(0);
    expect(valueFromX(100, 200)).toBe(50);
    expect(valueFromX(67, 200)).toBe(34);
  });
  it('clamps outside the track', () => {
    expect(valueFromX(-40, 200)).toBe(0);
    expect(valueFromX(999, 200)).toBe(100);
  });
  it('is safe before layout (width 0)', () => {
    expect(valueFromX(10, 0)).toBe(0);
  });
});
