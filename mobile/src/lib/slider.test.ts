import { createEchoFilter, positionFromX, shouldReport, valueFromX } from './slider';

describe('shouldReport', () => {
  it('reports every whole-number change when not coarse', () => {
    expect(shouldReport(41, 40, false)).toBe(true);
    expect(shouldReport(40, 40, false)).toBe(false);
  });

  it('when coarse, reports only a change of mood bucket', () => {
    expect(shouldReport(45, 41, true)).toBe(false); // Okay -> Okay
    expect(shouldReport(39, 40, true)).toBe(false); // Low -> Low (40 is still Low)
    expect(shouldReport(41, 40, true)).toBe(true); // Low -> Okay
    expect(shouldReport(20, 21, true)).toBe(true); // Low -> Heavy
    expect(shouldReport(21, 20, true)).toBe(true); // Heavy -> Low
    expect(shouldReport(100, 0, true)).toBe(true); // a fast flick across everything
    expect(shouldReport(0, 0, true)).toBe(false);
  });
});

describe('createEchoFilter', () => {
  it('treats the late echoes of a drag as echoes, so the thumb is not pulled back through old values', () => {
    const f = createEchoFilter();
    [40, 41, 42].forEach((v) => f.sent(v));
    expect([40, 41, 42].map((v) => f.isEcho(v))).toEqual([true, true, true]);
  });

  it('lets a real outside change through, including a value we reported earlier', () => {
    const f = createEchoFilter();
    [40, 41, 42].forEach((v) => f.sent(v));
    [40, 41, 42].forEach((v) => f.isEcho(v));
    expect(f.isEcho(70)).toBe(false); // reset or screen-reader step
    expect(f.isEcho(41)).toBe(false); // an old drag value, now a genuine outside change
  });

  it('skips echoes the app never delivered (batched renders)', () => {
    const f = createEchoFilter();
    [40, 41, 42].forEach((v) => f.sent(v));
    expect(f.isEcho(42)).toBe(true); // only the final value arrives
    expect(f.isEcho(40)).toBe(false);
  });
});

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
