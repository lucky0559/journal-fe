import { PEOPLE, POSTS, personById, friendStateOf, feedFor, profileView, nextFriendState } from './social';

const stateOf = (o: Record<string, 'none' | 'requested' | 'friends'> = {}) => (id: string) => friendStateOf(personById(id), o);

describe('social sample data', () => {
  it('has five people and seven posts', () => {
    expect(PEOPLE.map((p) => p.id)).toEqual(['jun', 'ana', 'leo', 'sol', 'kit']);
    expect(POSTS.map((p) => p.id)).toEqual(['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7']);
    expect(personById('sol').name).toBe('Sol Rivera');
  });
});

describe('feedFor', () => {
  it('Friends tab shows every post from accepted friends', () => {
    expect(feedFor('friends', POSTS, stateOf()).map((p) => p.id)).toEqual(['p1', 'p3', 'p5', 'p7']);
  });
  it('Public tab shows every public post, from anyone', () => {
    expect(feedFor('public', POSTS, stateOf()).map((p) => p.id)).toEqual(['p2', 'p4', 'p5', 'p6']);
  });
  it('drops an author from the Friends tab once the friendship is gone', () => {
    expect(feedFor('friends', POSTS, stateOf({ jun: 'none' })).map((p) => p.id)).toEqual(['p3', 'p5']);
  });
});

describe('profileView', () => {
  it('non-friends only see public posts and a count of hidden ones', () => {
    expect(profileView('sol', POSTS, stateOf())).toMatchObject({ hidden: 0 });
    expect(profileView('sol', POSTS, stateOf()).visible.map((p) => p.id)).toEqual(['p2', 'p6']);
    const jun = profileView('jun', POSTS, stateOf({ jun: 'none' }));
    expect(jun.visible).toEqual([]);
    expect(jun.hidden).toBe(2);
  });
  it('a pending request does not unlock friends-only posts', () => {
    expect(profileView('jun', POSTS, stateOf({ jun: 'requested' })).hidden).toBe(2);
  });
  it('friends see everything', () => {
    const v = profileView('jun', POSTS, stateOf());
    expect(v.visible.map((p) => p.id)).toEqual(['p1', 'p7']);
    expect(v.hidden).toBe(0);
  });
});

describe('nextFriendState', () => {
  it('toggles none <-> requested and leaves friends alone', () => {
    expect(nextFriendState('none')).toBe('requested');
    expect(nextFriendState('requested')).toBe('none');
    expect(nextFriendState('friends')).toBe('friends');
  });
});
