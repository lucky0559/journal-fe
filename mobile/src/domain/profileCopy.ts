import type { FriendState } from './types';

export const countLabel = (n: number): string => `${n} ${n === 1 ? 'page' : 'pages'} you can read`;

export const lockedNote = (hidden: number): string =>
  hidden > 0 ? `${hidden} ${hidden === 1 ? 'more page is' : 'more pages are'} for friends only.` : '';

export function friendButton(s: FriendState): { label: string; filled: boolean } {
  if (s === 'self') return { label: 'This is you', filled: false };
  if (s === 'friends') return { label: 'Friends', filled: false };
  if (s === 'requested') return { label: 'Request sent', filled: false };
  if (s === 'incoming') return { label: 'Accept request', filled: true };
  return { label: 'Add friend', filled: true };
}
