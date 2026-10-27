import { useCallback, useEffect, useRef, useState } from 'react';
import type { ApiPost, PostPage, ReactionKind } from '@/api/types';

interface State {
  posts: ApiPost[];
  nextBefore: string | null;
  hidden: number;
  status: 'loading' | 'ready' | 'error';
  loadingMore: boolean;
  loadMoreFailed: boolean;
}

const INITIAL: State = { posts: [], nextBefore: null, hidden: 0, status: 'loading', loadingMore: false, loadMoreFailed: false };

interface Deps {
  /** Changing the key (for example switching tabs) starts over. */
  key: string;
  fetchPage: (before?: string) => Promise<PostPage>;
  social: { react(id: string, kind: ReactionKind): Promise<unknown>; unreact(id: string, kind: ReactionKind): Promise<unknown> };
}

export function usePagedPosts({ key, fetchPage, social }: Deps) {
  const [state, setState] = useState<State>(INITIAL);
  const stateRef = useRef(state);
  stateRef.current = state;
  const fetchRef = useRef(fetchPage);
  fetchRef.current = fetchPage;
  const gen = useRef(0); // bumped on every fresh load so slow, outdated responses are ignored

  const loadFirst = useCallback(async (): Promise<boolean> => {
    const mine = ++gen.current;
    try {
      const page = await fetchRef.current();
      if (gen.current !== mine) return false;
      setState({ posts: page.posts, nextBefore: page.nextBefore, hidden: page.hidden ?? 0, status: 'ready', loadingMore: false, loadMoreFailed: false });
      return true;
    } catch {
      if (gen.current === mine) setState((s) => (s.posts.length ? s : { ...s, status: 'error' }));
      return false;
    }
  }, []);

  useEffect(() => {
    setState(INITIAL);
    void loadFirst();
  }, [key, loadFirst]);

  const refresh = useCallback(async () => {
    if (!stateRef.current.posts.length) setState((s) => ({ ...s, status: 'loading' }));
    return loadFirst();
  }, [loadFirst]);

  const loadMore = useCallback(async () => {
    const { nextBefore, loadingMore } = stateRef.current;
    if (!nextBefore || loadingMore) return;
    const mine = gen.current;
    setState((s) => ({ ...s, loadingMore: true, loadMoreFailed: false }));
    try {
      const page = await fetchRef.current(nextBefore);
      if (gen.current !== mine) return;
      setState((s) => {
        const seen = new Set(s.posts.map((p) => p.id));
        return { ...s, posts: [...s.posts, ...page.posts.filter((p) => !seen.has(p.id))], nextBefore: page.nextBefore, loadingMore: false };
      });
    } catch {
      if (gen.current === mine) setState((s) => ({ ...s, loadingMore: false, loadMoreFailed: true }));
    }
  }, []);

  const patch = (id: string, kind: ReactionKind, on: boolean) =>
    setState((s) => ({
      ...s,
      posts: s.posts.map((p) => (p.id === id ? { ...p, [kind]: Math.max(0, p[kind] + (on ? 1 : -1)), mine: { ...p.mine, [kind]: on } } : p)),
    }));

  /** Optimistic: the chip changes at once; if the server refuses it goes back. Resolves false on failure. */
  const toggleReaction = useCallback(async (id: string, kind: ReactionKind): Promise<boolean> => {
    const post = stateRef.current.posts.find((p) => p.id === id);
    if (!post) return false;
    const on = !post.mine[kind];
    patch(id, kind, on);
    try {
      await (on ? social.react(id, kind) : social.unreact(id, kind));
      return true;
    } catch {
      patch(id, kind, !on);
      return false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [social]);

  return {
    posts: state.posts,
    hidden: state.hidden,
    status: state.status,
    hasMore: state.nextBefore !== null,
    loadingMore: state.loadingMore,
    loadMoreFailed: state.loadMoreFailed,
    refresh,
    loadMore,
    toggleReaction,
  };
}
