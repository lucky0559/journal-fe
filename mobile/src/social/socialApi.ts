import type { ApiClient } from '@/api/client';
import type { ApiPost, ApiProfile, ApiUser, NotificationList, PostPage, ReactionKind, ReportCategory } from '@/api/types';
import type { FriendState } from '@/domain/types';

const PAGE = 20;

export function createSocialApi(api: ApiClient) {
  return {
    feed: (tab: 'friends' | 'public', before?: string) => api.request<PostPage>('GET', '/feed', { query: { tab, limit: PAGE, before } }),
    post: (id: string) => api.request<ApiPost>('GET', `/posts/${id}`),
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
    reportPost: (postId: string, category: ReportCategory) => api.request<void>('POST', `/posts/${postId}/report`, { body: { category } }),
    reportUser: (userId: string, category: ReportCategory) => api.request<void>('POST', `/users/${userId}/report`, { body: { category } }),
    block: (userId: string) => api.request<void>('PUT', `/blocks/${userId}`),
    unblock: (userId: string) => api.request<void>('DELETE', `/blocks/${userId}`),
    blocked: () => api.request<ApiUser[]>('GET', '/blocks'),
    notifications: () => api.request<NotificationList>('GET', '/notifications'),
    async unreadNotifications(): Promise<number> {
      return (await api.request<{ unread: number }>('GET', '/notifications/unread-count')).unread;
    },
    markNotificationsRead: () => api.request<void>('POST', '/notifications/read'),
    deleteAccount: () => api.request<void>('DELETE', '/me'),
  };
}

export type SocialApi = ReturnType<typeof createSocialApi>;
