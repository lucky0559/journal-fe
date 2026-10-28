export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTHS_SHORT = MONTHS.map((m) => m.slice(0, 3));
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const pad = (n: number) => String(n).padStart(2, '0');

/** Noon avoids DST edge cases when only the calendar date matters. */
export const isoToDate = (iso: string) => new Date(`${iso}T12:00:00`);
export const toIso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayIso = (now: Date = new Date()) => toIso(now);

export function addDays(iso: string, n: number): string {
  const d = isoToDate(iso);
  d.setDate(d.getDate() + n);
  return toIso(d);
}

export function fmtShort(iso: string): string {
  const d = isoToDate(iso);
  return `${WEEKDAYS[d.getDay()].slice(0, 3)}, ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}

export function fmtLong(iso: string): string {
  const d = isoToDate(iso);
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** The pieces a journal page heading is built from: the weekday, the day and month, and the year. */
export function fmtParts(iso: string): { weekday: string; day: number; month: string; year: number } {
  const d = isoToDate(iso);
  return { weekday: WEEKDAYS[d.getDay()], day: d.getDate(), month: MONTHS[d.getMonth()], year: d.getFullYear() };
}

export function fmtTime(d: Date): string {
  const h = d.getHours() % 12 || 12;
  return `${h}:${pad(d.getMinutes())} ${d.getHours() < 12 ? 'am' : 'pm'}`;
}

export const secs = (n: number) => `${Math.floor(n / 60)}:${pad(n % 60)}`;

export function greeting(hour: number): string {
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 18) return 'Good afternoon';
  return 'Good evening';
}
