import { sampleEntries } from '../../../test/sampleEntries';
import { groupByMonth } from './groupByMonth';

it('groups newest-first entries under month headings', () => {
  const groups = groupByMonth(sampleEntries('2026-10-08'));
  expect(groups.map((g) => [g.title, g.entries.length])).toEqual([['October 2026', 5], ['September 2026', 3]]);
});

it('returns nothing for no entries', () => {
  expect(groupByMonth([])).toEqual([]);
});

it('keeps the same month in different years apart', () => {
  const [a, b] = sampleEntries('2026-10-08');
  const groups = groupByMonth([a, { ...b, date: '2025-10-06' }]);
  expect(groups.map((g) => g.title)).toEqual(['October 2026', 'October 2025']);
});
