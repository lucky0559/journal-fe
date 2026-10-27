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
  /** Retry everything that did not reach the server (queued unpublishes first, then unsynced shared pages). */
  syncPending(): Promise<void>;
  /** A different account is now signed in: make every shared page private locally and forget sync state. */
  resetSharing(): Promise<void>;
}

/** Forget everything about the server copy of a page. */
const forgetRemote = (e: Entry): Entry => ({
  ...e,
  publishedAt: null,
  photos: e.photos.map(({ remoteKey: _k, ...p }) => p),
  voices: e.voices.map(({ remoteKey: _k, ...v }) => v),
});

export function createEntriesStore(getRepo: () => EntryRepo, gateway: SharingGateway, now: () => number = Date.now) {
  return create<EntriesState>()((set, get) => {
    let syncing = false;

    const put = async (e: Entry) => {
      await getRepo().upsert(e);
      set({ entries: sortEntries([e, ...get().entries.filter((x) => x.id !== e.id)]) });
    };

    /** Ask the server to drop a page. The request stays queued on disk until the server confirms. */
    const unpublishById = async (id: string) => {
      const repo = getRepo();
      await repo.queueUnpublish(id);
      try {
        await gateway.unpublish(id);
        await repo.unqueueUnpublish(id);
        const e = get().entries.find((x) => x.id === id);
        if (e && e.vis === 'private') await put(forgetRemote(e));
      } catch {
        // offline or server error: it remains queued and syncPending() retries it
      }
    };

    const share = async (e: Entry) => {
      await getRepo().unqueueUnpublish(e.id);
      try {
        const sent = await gateway.publish(e);
        await put({ ...sent, publishedAt: now() });
      } catch {
        // stays unsynced (publishedAt null); syncPending() retries it
      }
    };

    return {
      entries: [],
      loaded: false,
      async load() {
        set({ entries: sortEntries(await getRepo().list()), loaded: true });
      },
      async save(entry) {
        const previous = get().entries.find((e) => e.id === entry.id);
        const next = entry.vis === 'private' ? entry : { ...entry, publishedAt: null };
        await put(next);
        if (next.vis === 'private') {
          if (previous && previous.vis !== 'private') await unpublishById(next.id);
        } else {
          await share(next);
        }
      },
      async replaceAll(es) {
        const keep = new Set(es.map((e) => e.id));
        const shared = get().entries.filter((e) => e.vis !== 'private' && !keep.has(e.id));
        await getRepo().replaceAll(es);
        set({ entries: sortEntries(es) });
        await Promise.allSettled(shared.map((e) => unpublishById(e.id)));
      },
      async syncPending() {
        if (syncing) return;
        syncing = true;
        try {
          for (const id of await getRepo().pendingUnpublish()) await unpublishById(id);
          for (const e of get().entries.filter((x) => x.vis !== 'private' && x.publishedAt == null)) await share(e);
        } finally {
          syncing = false;
        }
      },
      async resetSharing() {
        const repo = getRepo();
        for (const id of await repo.pendingUnpublish()) await repo.unqueueUnpublish(id);
        for (const e of get().entries) {
          const hasRemote = e.publishedAt != null || e.photos.some((p) => p.remoteKey) || e.voices.some((v) => v.remoteKey);
          if (e.vis !== 'private' || hasRemote) await put({ ...forgetRemote(e), vis: 'private' });
        }
      },
    };
  });
}
