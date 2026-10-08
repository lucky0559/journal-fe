import { ramp } from '@/theme/tokens';
import type { FriendState, Person, Post } from './types';

export const PEOPLE: Person[] = [
  { id: 'jun', name: 'Jun', initial: 'J', color: ramp.accent2[300], bio: 'Cooks too much, writes about it after.', friendState: 'friends' },
  { id: 'ana', name: 'Ana', initial: 'A', color: ramp.accent[300], bio: 'Second year of nursing school.', friendState: 'friends' },
  { id: 'leo', name: 'Leo', initial: 'L', color: ramp.neutral[300], bio: 'Learning to be okay with slow days.', friendState: 'friends' },
  { id: 'sol', name: 'Sol Rivera', initial: 'S', color: ramp.accent[400], bio: 'Writing one line a day since June.', friendState: 'none' },
  { id: 'kit', name: 'Kit', initial: 'K', color: ramp.accent2[200], bio: 'Night shifts and small joys.', friendState: 'none' },
];

export const POSTS: Post[] = [
  { id: 'p1', authorId: 'jun', when: 'Today · 8:50 pm', vis: 'friends', prompt: 'Who did you feel close to today?', text: 'Maya came over and we burned the garlic again. Best dinner this month.', photoLabel: 'photo · two plates', hug: 2, same: 1 },
  { id: 'p2', authorId: 'sol', when: 'Today · 7:15 pm', vis: 'public', prompt: '', text: 'Line 112: the bus driver waited for me. Small thing, carried it all day.', photoLabel: '', hug: 41, same: 18 },
  { id: 'p3', authorId: 'ana', when: 'Today · 6:02 pm', vis: 'friends', prompt: 'What’s taking up the most room in your head right now?', text: 'Exam on Friday. Writing it down so it takes up less space.', photoLabel: '', hug: 5, same: 3 },
  { id: 'p4', authorId: 'kit', when: 'Yesterday · 4:30 am', vis: 'public', prompt: 'Describe one sound you heard today.', text: 'The first bird at 4:30, right as my shift ended. Felt like it was for me.', photoLabel: 'photo · empty street at dawn', hug: 63, same: 22 },
  { id: 'p5', authorId: 'leo', when: 'Yesterday · 10:40 pm', vis: 'public', prompt: '', text: 'Didn’t do much today and I’m trying not to make that mean anything.', photoLabel: '', hug: 12, same: 30 },
  { id: 'p6', authorId: 'sol', when: 'Tue 6 Oct · 9:00 pm', vis: 'public', prompt: 'Name something small you’re looking forward to.', text: 'Line 111: new socks. I am easy to please.', photoLabel: '', hug: 27, same: 9 },
  { id: 'p7', authorId: 'jun', when: 'Mon 5 Oct · 11:10 pm', vis: 'friends', prompt: '', text: 'Long day at the shop. Repotted the basil when I got home and felt human again.', photoLabel: 'photo · basil', hug: 3, same: 0 },
];

export const personById = (id: string): Person => PEOPLE.find((p) => p.id === id) ?? PEOPLE[0];

export type FriendOverrides = Record<string, FriendState>;
export const friendStateOf = (p: Person, o: FriendOverrides): FriendState => o[p.id] ?? p.friendState;

type StateOf = (personId: string) => FriendState;

export const feedFor = (tab: 'friends' | 'public', posts: Post[], stateOf: StateOf): Post[] =>
  tab === 'friends' ? posts.filter((p) => stateOf(p.authorId) === 'friends') : posts.filter((p) => p.vis === 'public');

export function profileView(personId: string, posts: Post[], stateOf: StateOf): { visible: Post[]; hidden: number } {
  const all = posts.filter((p) => p.authorId === personId);
  const isFriend = stateOf(personId) === 'friends';
  const visible = all.filter((p) => p.vis === 'public' || isFriend);
  return { visible, hidden: all.length - visible.length };
}

export const nextFriendState = (s: FriendState): FriendState => (s === 'none' ? 'requested' : s === 'requested' ? 'none' : s);
