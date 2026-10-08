import { demoEntries } from './demoData';

describe('demoEntries', () => {
  const es = demoEntries('2026-10-08');
  it('recreates the eight prototype pages relative to today', () => {
    expect(es.map((e) => e.date)).toEqual([
      '2026-10-07', '2026-10-06', '2026-10-05', '2026-10-03', '2026-10-01', '2026-09-28', '2026-09-24', '2026-09-20',
    ]);
    expect(es.map((e) => e.mood)).toEqual([72, 28, 55, 84, 46, 18, 66, 92]);
  });
  it('has the right visibility, media and copy', () => {
    expect(es[0]).toMatchObject({ vis: 'friends', stickers: ['cozy'], time: '10:02 pm' });
    expect(es[0].photos[0]).toMatchObject({ uri: '', label: 'photo · dinner' });
    expect(es[1].voices[0].seconds).toBe(38);
    expect(es[3].vis).toBe('public');
    expect(es[3].photos).toHaveLength(2);
    expect(es[6].text).toBe('Sunlight on the kitchen floor at 5pm. That’s it, that’s the entry.');
    expect(es.filter((e) => e.vis === 'private')).toHaveLength(6);
  });
  it('uses unique ids and strictly ordered createdAt', () => {
    expect(new Set(es.map((e) => e.id)).size).toBe(8);
    const created = es.map((e) => e.createdAt);
    expect([...created].sort((a, b) => b - a)).toEqual(created);
  });
  it('shifts with the supplied day', () => {
    expect(demoEntries('2027-03-02')[0].date).toBe('2027-03-01');
  });
});
