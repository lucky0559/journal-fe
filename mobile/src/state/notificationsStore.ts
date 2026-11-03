import { create } from 'zustand';
import { social } from '@/social';

interface NotificationsState {
  /** How many notifications have not been opened yet (the badge on the bell). */
  unread: number;
  refresh(): Promise<void>;
  clear(): void;
}

export const useNotifications = create<NotificationsState>()((set) => ({
  unread: 0,
  async refresh() {
    try {
      set({ unread: await social.unreadNotifications() });
    } catch {
      // offline or signed out: keep what we had, the badge is only a hint
    }
  },
  clear: () => set({ unread: 0 }),
}));
