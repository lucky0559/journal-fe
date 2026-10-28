import { moodIndex } from './mood';

// Worklets: the slider drag runs on the UI thread, so these must not touch anything from the JS scope.

/** Position along the track as a 0-100 fraction (not rounded), for smooth thumb movement. */
export const positionFromX = (x: number, width: number): number => {
  'worklet';
  return width <= 0 ? 0 : Math.max(0, Math.min(100, (x / width) * 100));
};

/**
 * Whether a drag that reached `whole` should be reported to JS. `coarse` reports only when the mood bucket changes
 * (the label and prompt cards), so a fast drag sends a handful of updates instead of up to a hundred.
 */
export const shouldReport = (whole: number, reported: number, coarse: boolean): boolean => {
  'worklet';
  if (whole === reported) return false;
  return !coarse || moodIndex(whole) !== moodIndex(reported);
};

/**
 * Values the slider reports come back through its `value` prop a little late. `isEcho` recognises those, so only
 * genuine outside changes (reset, screen-reader steps) move the thumb. Plain JS: it runs on the JS thread.
 */
export function createEchoFilter() {
  const sent = new Set<number>();
  let latest: number | null = null;
  return {
    sent(v: number) {
      sent.add(v);
      latest = v;
    },
    isEcho(value: number): boolean {
      if (!sent.has(value)) return false;
      if (value === latest) sent.clear(); // the final value is back, so no more echoes are on the way
      return true;
    },
  };
}

export const valueFromX = (x: number, width: number): number => {
  'worklet';
  return Math.round(positionFromX(x, width));
};
