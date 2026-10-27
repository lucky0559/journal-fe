import type { ApiPost, ApiUser } from '@/api/types';

export const ana: ApiUser = { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', name: 'Ana Reyes', givenName: 'Ana', photo: null, bio: 'Second year of nursing school.' };
export const jun: ApiUser = { id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', name: 'Jun Park', givenName: 'Jun', photo: null, bio: 'Cooks too much.' };
export const sol: ApiUser = { id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', name: 'Sol Rivera', givenName: 'Sol', photo: null, bio: 'One line a day.' };

export const apiPost = (id: string, author: ApiUser, over: Partial<ApiPost> = {}): ApiPost => ({
  id, author, date: '2026-10-08', time: '8:50 pm', vis: 'friends', prompt: '', text: `text of ${id}`, stickers: [], photos: [], voices: [],
  hug: 2, same: 1, mine: { hug: false, same: false }, createdAt: '2026-10-08T12:50:00.000Z', ...over,
});
