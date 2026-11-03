import type { ApiNotification } from '@/api/types';

/** One plain sentence for a notification, starting with who did it. */
export function notificationText(n: Pick<ApiNotification, 'kind' | 'reaction' | 'actor'>): string {
  const who = n.actor.givenName || n.actor.name;
  switch (n.kind) {
    case 'friend_request': return `${who} sent you a friend request`;
    case 'friend_accepted': return `${who} accepted your friend request`;
    case 'reaction': return n.reaction === 'hug' ? `${who} sent a hug to your page` : `${who} said “Same” on your page`;
  }
}

/** "just now", "5 min ago", "3 h ago", "yesterday", or "4 d ago". */
export function timeAgo(iso: string, now: number): string {
  const mins = Math.max(0, Math.floor((now - Date.parse(iso)) / 60_000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? 'yesterday' : `${days} d ago`;
}
