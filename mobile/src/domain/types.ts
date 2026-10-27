export type Visibility = 'private' | 'friends' | 'public';
export interface Photo { id: string; uri: string; label?: string; remoteKey?: string /* key of the uploaded copy once shared */ }      // uri '' = striped placeholder (demo data)
export interface Voice { id: string; uri: string; seconds: number; remoteKey?: string }      // uri '' = demo voice note (silent)
export interface Entry {
  id: string; createdAt: number; date: string /* YYYY-MM-DD */; time: string /* '9:41 pm' */;
  mood: number /* 0-100 */; feelings: string[]; text: string; prompt: string; vis: Visibility;
  photos: Photo[]; voices: Voice[]; stickers: string[];
  /** When this page's current content last reached the server. null/undefined = not synced yet (only meaningful for shared pages). */
  publishedAt?: number | null;
}
export interface Settings { name: string; remind: boolean; remindTime: string /* '9:00 pm' */; lockOn: boolean; onboarded: boolean; /** server id of the account whose shared pages this phone syncs */ syncOwner: string }
export type FriendState = 'none' | 'requested' | 'friends';
export interface Person { id: string; name: string; initial: string; color: string; bio: string; friendState: FriendState }
export interface Post { id: string; authorId: string; when: string; vis: Visibility; prompt: string; text: string; photoLabel: string; hug: number; same: number }
