import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ApiPost } from '@/api/types';
import { usePagedPosts } from './usePagedPosts';

const post = (id: string, over: Partial<ApiPost> = {}): ApiPost => ({
  id, author: { id: 'a', name: 'Ana', givenName: 'Ana', photo: null, bio: '' }, date: '2026-10-08', time: '9:00 pm', vis: 'public',
  prompt: '', text: id, stickers: [], photos: [], voices: [], hug: 2, same: 0, mine: { hug: false, same: false }, createdAt: '2026-10-08T12:00:00.000Z', ...over,
});

const social = () => ({ react: jest.fn(async () => {}), unreact: jest.fn(async () => {}) });

describe('usePagedPosts', () => {
  it('loads the first page and exposes ready state', async () => {
    const fetchPage = jest.fn(async () => ({ posts: [post('p1'), post('p2')], nextBefore: 'c1', hidden: 3 }));
    const { result } = renderHook(() => usePagedPosts({ key: 'k', fetchPage, social: social() }));
    expect(result.current.status).toBe('loading');
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.posts.map((p) => p.id)).toEqual(['p1', 'p2']);
    expect(result.current.hasMore).toBe(true);
    expect(result.current.hidden).toBe(3);
  });

  it('reports an error and lets you retry', async () => {
    const fetchPage = jest.fn().mockRejectedValueOnce(new Error('down')).mockResolvedValue({ posts: [post('p1')], nextBefore: null });
    const { result } = renderHook(() => usePagedPosts({ key: 'k', fetchPage, social: social() }));
    await waitFor(() => expect(result.current.status).toBe('error'));
    await act(async () => { await result.current.refresh(); });
    expect(result.current.status).toBe('ready');
    expect(result.current.posts).toHaveLength(1);
  });

  it('appends the next page without duplicates and stops at the end', async () => {
    const fetchPage = jest.fn()
      .mockResolvedValueOnce({ posts: [post('p1'), post('p2')], nextBefore: 'c1' })
      .mockResolvedValueOnce({ posts: [post('p2'), post('p3')], nextBefore: null });
    const { result } = renderHook(() => usePagedPosts({ key: 'k', fetchPage, social: social() }));
    await waitFor(() => expect(result.current.status).toBe('ready'));
    await act(async () => { await result.current.loadMore(); });
    expect(fetchPage).toHaveBeenLastCalledWith('c1');
    expect(result.current.posts.map((p) => p.id)).toEqual(['p1', 'p2', 'p3']);
    expect(result.current.hasMore).toBe(false);
    await act(async () => { await result.current.loadMore(); });
    expect(fetchPage).toHaveBeenCalledTimes(2);
  });

  it('keeps the list when a later page fails to load', async () => {
    const fetchPage = jest.fn()
      .mockResolvedValueOnce({ posts: [post('p1')], nextBefore: 'c1' })
      .mockRejectedValueOnce(new Error('down'));
    const { result } = renderHook(() => usePagedPosts({ key: 'k', fetchPage, social: social() }));
    await waitFor(() => expect(result.current.status).toBe('ready'));
    await act(async () => { await result.current.loadMore(); });
    expect(result.current.posts).toHaveLength(1);
    expect(result.current.loadMoreFailed).toBe(true);
    expect(result.current.hasMore).toBe(true);
  });

  it('reloads when the key changes and ignores a slow response for the old key', async () => {
    let releaseOld: (v: unknown) => void = () => {};
    const fetchPage = jest.fn()
      .mockImplementationOnce(() => new Promise((res) => { releaseOld = res; }))
      .mockResolvedValueOnce({ posts: [post('new')], nextBefore: null });
    const { result, rerender } = renderHook((p: { key: string }) => usePagedPosts({ key: p.key, fetchPage, social: social() }), { initialProps: { key: 'friends' } });
    rerender({ key: 'public' });
    await waitFor(() => expect(result.current.posts.map((p) => p.id)).toEqual(['new']));
    await act(async () => { releaseOld({ posts: [post('old')], nextBefore: null }); });
    expect(result.current.posts.map((p) => p.id)).toEqual(['new']);
  });

  describe('reactions', () => {
    const load = async (s = social()) => {
      const fetchPage = jest.fn(async () => ({ posts: [post('p1')], nextBefore: null }));
      const r = renderHook(() => usePagedPosts({ key: 'k', fetchPage, social: s }));
      await waitFor(() => expect(r.result.current.status).toBe('ready'));
      return r;
    };

    it('updates the count and flag straight away, then tells the server', async () => {
      const s = social();
      const { result } = await load(s);
      await act(async () => { await result.current.toggleReaction('p1', 'hug'); });
      expect(result.current.posts[0]).toMatchObject({ hug: 3, mine: { hug: true } });
      expect(s.react).toHaveBeenCalledWith('p1', 'hug');
      await act(async () => { await result.current.toggleReaction('p1', 'hug'); });
      expect(result.current.posts[0]).toMatchObject({ hug: 2, mine: { hug: false } });
      expect(s.unreact).toHaveBeenCalledWith('p1', 'hug');
    });

    it('puts it back and reports failure when the server refuses', async () => {
      const s = social();
      s.react.mockRejectedValueOnce(new Error('offline'));
      const { result } = await load(s);
      let ok = true;
      await act(async () => { ok = await result.current.toggleReaction('p1', 'same'); });
      expect(ok).toBe(false);
      expect(result.current.posts[0]).toMatchObject({ same: 0, mine: { same: false } });
    });
  });
});
