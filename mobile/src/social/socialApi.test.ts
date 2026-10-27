/** @jest-environment node */
import type { ApiClient } from '@/api/client';
import { createSocialApi } from './socialApi';

function setup(result: unknown = {}) {
  const request = jest.fn(async (..._a: unknown[]) => result);
  return { social: createSocialApi({ request } as unknown as ApiClient), request };
}

describe('socialApi', () => {
  it('loads the feed with paging', async () => {
    const { social, request } = setup({ posts: [], nextBefore: null });
    await social.feed('friends');
    await social.feed('public', 'cursor_1');
    expect(request).toHaveBeenNthCalledWith(1, 'GET', '/feed', { query: { tab: 'friends', limit: 20, before: undefined } });
    expect(request).toHaveBeenNthCalledWith(2, 'GET', '/feed', { query: { tab: 'public', limit: 20, before: 'cursor_1' } });
  });

  it('loads a profile and its pages', async () => {
    const { social, request } = setup({});
    await social.user('u1');
    await social.userPosts('u1', 'c');
    expect(request).toHaveBeenNthCalledWith(1, 'GET', '/users/u1');
    expect(request).toHaveBeenNthCalledWith(2, 'GET', '/users/u1/posts', { query: { limit: 20, before: 'c' } });
  });

  it('runs the friend actions against the right endpoints', async () => {
    const { social, request } = setup({ friendState: 'requested' });
    expect(await social.requestFriend('u1')).toBe('requested');
    await social.cancelRequest('u1');
    await social.accept('u1');
    await social.decline('u1');
    await social.unfriend('u1');
    await social.friends();
    await social.incoming();
    expect(request.mock.calls).toEqual([
      ['POST', '/friends/requests', { body: { userId: 'u1' } }],
      ['DELETE', '/friends/requests/u1'],
      ['POST', '/friends/requests/u1/accept'],
      ['POST', '/friends/requests/u1/decline'],
      ['DELETE', '/friends/u1'],
      ['GET', '/friends'],
      ['GET', '/friends/requests'],
    ]);
  });

  it('adds and removes reactions', async () => {
    const { social, request } = setup();
    await social.react('p1', 'hug');
    await social.unreact('p1', 'same');
    expect(request.mock.calls).toEqual([['PUT', '/posts/p1/reactions/hug'], ['DELETE', '/posts/p1/reactions/same']]);
  });

  it('deletes the account', async () => {
    const { social, request } = setup();
    await social.deleteAccount();
    expect(request).toHaveBeenCalledWith('DELETE', '/me');
  });
});
