import { avatarColor, initialOf, parseProfileLink, whenLabel } from './postView';
import { ramp } from '@/theme/tokens';

describe('whenLabel', () => {
  it('says Today and Yesterday, otherwise a short date', () => {
    expect(whenLabel({ date: '2026-10-08', time: '8:50 pm' }, '2026-10-08')).toBe('Today · 8:50 pm');
    expect(whenLabel({ date: '2026-10-07', time: '10:40 pm' }, '2026-10-08')).toBe('Yesterday · 10:40 pm');
    expect(whenLabel({ date: '2026-10-06', time: '9:00 pm' }, '2026-10-08')).toBe('Tue, 6 Oct · 9:00 pm');
  });
  it('copes with month boundaries', () => {
    expect(whenLabel({ date: '2026-09-30', time: '9:00 pm' }, '2026-10-01')).toBe('Yesterday · 9:00 pm');
  });
});

describe('initialOf and avatarColor', () => {
  it('uses the first letter, uppercased, with a fallback', () => {
    expect(initialOf('maya cruz')).toBe('M');
    expect(initialOf('  ')).toBe('?');
  });
  it('gives the same colour for the same id, from the palette', () => {
    const a = avatarColor('11111111-1111-4111-8111-111111111111');
    expect(avatarColor('11111111-1111-4111-8111-111111111111')).toBe(a);
    expect([...Object.values(ramp.accent), ...Object.values(ramp.accent2), ...Object.values(ramp.neutral)]).toContain(a);
  });
});

describe('parseProfileLink', () => {
  const id = 'a1b2c3d4-e5f6-4a7b-8c9d-0123456789ab';
  it('finds the id in a link, a message, or on its own', () => {
    expect(parseProfileLink(`journal:///friends/${id}`)).toBe(id);
    expect(parseProfileLink(`journal://friends/${id}`)).toBe(id);
    expect(parseProfileLink(`Add me on Journal: journal:///friends/${id} thanks!`)).toBe(id);
    expect(parseProfileLink(`  ${id.toUpperCase()}  `)).toBe(id);
  });
  it('returns null when there is no id', () => {
    expect(parseProfileLink('')).toBeNull();
    expect(parseProfileLink('hello there')).toBeNull();
    expect(parseProfileLink('1234-5678')).toBeNull();
  });
});
