export const TIMES = ['8:00 pm', '9:00 pm', '10:00 pm', '11:00 pm'];

export function parseTimeLabel(label: string): { hour: number; minute: number } {
  const m = /^(\d{1,2}):(\d{2})\s*(am|pm)$/i.exec(label.trim());
  if (!m) return { hour: 21, minute: 0 };
  let hour = parseInt(m[1], 10) % 12;
  if (m[3].toLowerCase() === 'pm') hour += 12;
  return { hour, minute: parseInt(m[2], 10) };
}
