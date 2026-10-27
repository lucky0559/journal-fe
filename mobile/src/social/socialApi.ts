import type { ApiClient } from '@/api/client';
import type { ApiProfile, ApiUser, PostPage, ReactionKind } from '@/api/types';
import type { FriendState } from '@/domain/types';

const PAGE = 20;

export function createSocialApi(api: ApiClient) {
  return {
    feed: (tab: 'friends' | 'public', before?: string) => api.request<PostPage>('GET', '/feed', { query: { tab, limit: PAGE, before } }),
    user: (id: string) => api.request<ApiProfile>('GET', `/users/${id}`),
    userPosts: (id: string, before?: string) => api.request<PostPage>('GET', `/users/${id}/posts`, { query: { limit: PAGE, before } }),
    friends: () => api.request<ApiUser[]>('GET', '/friends'),
    incoming: () => api.request<ApiUser[]>('GET', '/friends/requests'),
    async requestFriend(id: string): Promise<FriendState> {
      return (await api.request<{ friendState: FriendState }>('POST', '/friends/requests', { body: { userId: id } })).friendState;
    },
    cancelRequest: (id: string) => api.request<void>('DELETE', `/friends/requests/${id}`),
    async accept(id: string): Promise<FriendState> {
      return (await api.request<{ friendState: FriendState }>('POST', `/friends/requests/${id}/accept`)).friendState;
    },
    decline: (id: string) => api.request<void>('POST', `/friends/requests/${id}/decline`),
    unfriend: (id: string) => api.request<void>('DELETE', `/friends/${id}`),
    react: (postId: string, kind: ReactionKind) => api.request<void>('PUT', `/posts/${postId}/reactions/${kind}`),
    unreact: (postId: string, kind: ReactionKind) => api.request<void>('DELETE', `/posts/${postId}/reactions/${kind}`),
    deleteAccount: () => api.request<void>('DELETE', '/me'),
  };
}

export type SocialApi = ReturnType<typeof createSocialApi>;
