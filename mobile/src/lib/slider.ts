// Worklets: the slider drag runs on the UI thread, so these must not touch anything from the JS scope.

/** Position along the track as a 0-100 fraction (not rounded), for smooth thumb movement. */
export const positionFromX = (x: number, width: number): number => {
  'worklet';
  return width <= 0 ? 0 : Math.max(0, Math.min(100, (x / width) * 100));
};

export const valueFromX = (x: number, width: number): number => {
  'worklet';
  return Math.round(positionFromX(x, width));
};
