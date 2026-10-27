import { countLabel, lockedNote, friendButton } from './profileCopy';

it('pluralises the readable-pages count', () => {
  expect(countLabel(0)).toBe('0 pages you can read');
  expect(countLabel(1)).toBe('1 page you can read');
  expect(countLabel(2)).toBe('2 pages you can read');
});

it('writes the friends-only note, or nothing', () => {
  expect(lockedNote(0)).toBe('');
  expect(lockedNote(1)).toBe('1 more page is for friends only.');
  expect(lockedNote(2)).toBe('2 more pages are for friends only.');
});

it('labels the friend button for each state', () => {
  expect(friendButton('none')).toEqual({ label: 'Add friend', filled: true });
  expect(friendButton('requested')).toEqual({ label: 'Request sent', filled: false });
  expect(friendButton('friends')).toEqual({ label: 'Friends', filled: false });
  expect(friendButton('incoming')).toEqual({ label: 'Accept request', filled: true });
  expect(friendButton('self')).toEqual({ label: 'This is you', filled: false });
});
