import type { FriendState, Visibility } from '@/domain/types';

export interface ApiUser { id: string; name: string; givenName: string; photo: string | null; bio: string }
export interface ApiProfile extends ApiUser { friendState: FriendState }

export interface ApiPost {
  id: string;
  author: ApiUser;
  date: string;
  time: string;
  vis: Exclude<Visibility, 'private'>;
  prompt: string;
  text: string;
  stickers: string[];
  photos: { key: string; url: string }[];
  voices: { key: string; seconds: number; url: string }[];
  hug: number;
  same: number;
  mine: { hug: boolean; same: boolean };
  createdAt: string;
}

export interface PostPage { posts: ApiPost[]; nextBefore: string | null; hidden?: number }
export type ReactionKind = 'hug' | 'same';

export interface ApiNotification {
  id: string;
  kind: 'friend_request' | 'friend_accepted' | 'reaction';
  actor: { id: string; name: string; givenName: string; photo: string | null };
  /** The page that was reacted to (reactions only). */
  postId: string | null;
  reaction: ReactionKind | null;
  read: boolean;
  createdAt: string;
}
export interface NotificationList { items: ApiNotification[]; unread: number }
