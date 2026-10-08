import { create } from 'zustand';
import type { Entry } from '@/domain/types';
import type { EntryRepo } from '@/data/entryRepo';
import type { SharingGateway } from '@/data/sharing';

export const sortEntries = (es: Entry[]): Entry[] =>
  [...es].sort((a, b) => (a.date === b.date ? b.createdAt - a.createdAt : a.date < b.date ? 1 : -1));

export interface EntriesState {
  entries: Entry[];
  loaded: boolean;
  load(): Promise<void>;
  save(e: Entry): Promise<void>;
  replaceAll(es: Entry[]): Promise<void>;
}

export function createEntriesStore(getRepo: () => EntryRepo, gateway: SharingGateway) {
  return create<EntriesState>()((set, get) => ({
    entries: [],
    loaded: false,
    async load() {
      set({ entries: sortEntries(await getRepo().list()), loaded: true });
    },
    async save(entry) {
      const previous = get().entries.find((e) => e.id === entry.id);
      await getRepo().upsert(entry);
      set({ entries: sortEntries([entry, ...get().entries.filter((e) => e.id !== entry.id)]) });
      try {
        if (entry.vis === 'private') {
          if (previous && previous.vis !== 'private') await gateway.unpublish(entry.id);
        } else {
          await gateway.publish(entry);
        }
      } catch {
        // Sharing is best-effort; the local page is already saved.
      }
    },
    async replaceAll(es) {
      const shared = get().entries.filter((e) => e.vis !== 'private');
      await getRepo().replaceAll(es);
      set({ entries: sortEntries(es) });
      await Promise.allSettled(shared.map((e) => gateway.unpublish(e.id)));
    },
  }));
}
