import { addDays, fmtShort } from '@/lib/dates';
import { ramp } from '@/theme/tokens';

export function whenLabel(p: { date: string; time: string }, today: string): string {
  if (p.date === today) return `Today · ${p.time}`;
  if (p.date === addDays(today, -1)) return `Yesterday · ${p.time}`;
  return `${fmtShort(p.date)} · ${p.time}`;
}

export const initialOf = (name: string): string => name.trim().charAt(0).toUpperCase() || '?';

const PALETTE = [ramp.accent2[300], ramp.accent[300], ramp.neutral[300], ramp.accent[400], ramp.accent2[200]];

/** The server has no avatar colour, so pick a stable one from the user id. */
export function avatarColor(id: string): string {
  const h = [...id].reduce((a, c) => a + c.charCodeAt(0), 0);
  return PALETTE[h % PALETTE.length];
}

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

/** Accepts a shared profile link, a message containing one, or a bare id. */
export function parseProfileLink(text: string): string | null {
  return UUID.exec(text)?.[0].toLowerCase() ?? null;
}
