export const valueFromX = (x: number, width: number): number =>
  width <= 0 ? 0 : Math.round(Math.max(0, Math.min(100, (x / width) * 100)));
