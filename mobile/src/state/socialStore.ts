import { create } from 'zustand';
import type { FriendState } from '@/domain/types';
import { friendStateOf, nextFriendState, personById, type FriendOverrides } from '@/domain/social';

interface SocialState {
  overrides: FriendOverrides;
  reacts: Record<string, { hug?: boolean; same?: boolean }>;
  toggleReact(postId: string, key: 'hug' | 'same'): void;
  toggleFriend(personId: string): FriendState;
  stateOf(personId: string): FriendState;
}

export const useSocial = create<SocialState>()((set, get) => ({
  overrides: {},
  reacts: {},
  toggleReact: (postId, key) =>
    set((s) => ({ reacts: { ...s.reacts, [postId]: { ...s.reacts[postId], [key]: !s.reacts[postId]?.[key] } } })),
  stateOf: (id) => friendStateOf(personById(id), get().overrides),
  toggleFriend(id) {
    const next = nextFriendState(get().stateOf(id));
    set((s) => ({ overrides: { ...s.overrides, [id]: next } }));
    return next;
  },
}));
