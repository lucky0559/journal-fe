import { notificationText, timeAgo } from './notificationView';

const actor = { id: 'u1', name: 'Jun Park', givenName: 'Jun', photo: null };

describe('notificationText', () => {
  it('says what each kind of notification is', () => {
    expect(notificationText({ kind: 'friend_request', reaction: null, actor })).toBe('Jun sent you a friend request');
    expect(notificationText({ kind: 'friend_accepted', reaction: null, actor })).toBe('Jun accepted your friend request');
    expect(notificationText({ kind: 'reaction', reaction: 'hug', actor })).toBe('Jun sent a hug to your page');
    expect(notificationText({ kind: 'reaction', reaction: 'same', actor })).toBe('Jun said “Same” on your page');
  });

  it('falls back to the full name when there is no given name', () => {
    expect(notificationText({ kind: 'friend_request', reaction: null, actor: { ...actor, givenName: '' } })).toBe('Jun Park sent you a friend request');
  });
});

describe('timeAgo', () => {
  const now = Date.parse('2026-10-08T12:00:00Z');
  const ago = (ms: number) => new Date(now - ms).toISOString();

  it('uses minutes, hours and days', () => {
    expect(timeAgo(ago(20_000), now)).toBe('just now');
    expect(timeAgo(ago(5 * 60_000), now)).toBe('5 min ago');
    expect(timeAgo(ago(3 * 3_600_000), now)).toBe('3 h ago');
    expect(timeAgo(ago(30 * 3_600_000), now)).toBe('yesterday');
    expect(timeAgo(ago(4 * 86_400_000), now)).toBe('4 d ago');
  });

  it('never shows a time in the future', () => {
    expect(timeAgo(new Date(now + 60_000).toISOString(), now)).toBe('just now');
  });
});
