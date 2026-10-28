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
  /** Stores the page on the phone, then saves it to the account in the background. */
  save(e: Entry): Promise<void>;
  /** Resolves when the saves to the account that are in flight have finished. */
  idle(): Promise<void>;
  replaceAll(es: Entry[]): Promise<void>;
  /** Retry everything that did not reach the account (queued deletions first, then every unsynced page). */
  syncPending(): Promise<void>;
  /** Bring in what the account has that this phone doesn't (and newer versions of synced pages). Returns how many pages changed. */
  restore(): Promise<number>;
  /** A different account signed in: the journal on this phone belongs to the other account (it is saved there), so clear it. */
  resetForNewAccount(): Promise<void>;
  /** The account was deleted: keep the pages on this phone but forget the server copies, so a later sign-in saves them afresh. */
  detachFromAccount(): Promise<void>;
}

/** Remember the uploads of a page that was edited while it was being saved, so they aren't uploaded twice. */
const withKeys = <T extends { id: string; remoteKey?: string }>(local: T[], sent: T[]): T[] => {
  const keys = new Map(sent.map((f) => [f.id, f.remoteKey]));
  return local.map((f) => (f.remoteKey || !keys.get(f.id) ? f : { ...f, remoteKey: keys.get(f.id) }));
};

export function createEntriesStore(getRepo: () => EntryRepo, gateway: SharingGateway, now: () => number = Date.now) {
  return create<EntriesState>()((set, get) => {
    let syncing = false;
    let restoring = false;
    const chains = new Map<string, Promise<void>>();

    const put = async (e: Entry) => {
      await getRepo().upsert(e);
      set({ entries: sortEntries([e, ...get().entries.filter((x) => x.id !== e.id)]) });
    };

    /** Ask the server to delete a page. The request stays queued on disk until the server confirms. */
    const deleteRemote = async (id: string) => {
      const repo = getRepo();
      await repo.queueUnpublish(id);
      try {
        await gateway.unpublish(id);
        await repo.unqueueUnpublish(id);
      } catch {
        // offline or server error: it remains queued and syncPending() retries it
      }
    };

    /** Save the latest version of a page to the account, if it isn't there yet. */
    const run = async (id: string) => {
      const e = get().entries.find((x) => x.id === id);
      if (!e || e.publishedAt != null) return;
      await getRepo().unqueueUnpublish(id); // saving a page cancels a pending deletion of it
      try {
        const sent = await gateway.publish(e);
        const latest = get().entries.find((x) => x.id === id);
        if (!latest) return;
        if (latest === e) {
          await put({ ...sent, publishedAt: sent.publishedAt ?? now() });
        } else {
          // Edited while it was uploading: keep the edit, remember the uploads. It stays pending and goes next.
          await put({ ...latest, photos: withKeys(latest.photos, sent.photos), voices: withKeys(latest.voices, sent.voices) });
        }
      } catch {
        // stays unsynced (publishedAt null); syncPending() retries it
      }
    };

    /** One save per page at a time, in order, so an older version can never land after a newer one. */
    const sync = (id: string) => {
      const next = (chains.get(id) ?? Promise.resolve()).then(() => run(id));
      chains.set(id, next);
      void next.finally(() => { if (chains.get(id) === next) chains.delete(id); });
      return next;
    };

    return {
      entries: [],
      loaded: false,
      async load() {
        set({ entries: sortEntries(await getRepo().list()), loaded: true });
      },
      async save(entry) {
        await put({ ...entry, publishedAt: null });
        void sync(entry.id); // the page is safe on the phone already; uploading carries on in the background
      },
      async idle() {
        await Promise.allSettled([...chains.values()]);
      },
      async replaceAll(es) {
        const keep = new Set(es.map((e) => e.id));
        const removed = get().entries.filter((e) => e.publishedAt != null && !keep.has(e.id));
        await getRepo().replaceAll(es);
        set({ entries: sortEntries(es) });
        await Promise.allSettled(removed.map((e) => deleteRemote(e.id)));
      },
      async syncPending() {
        if (syncing) return;
        syncing = true;
        try {
          for (const id of await getRepo().pendingUnpublish()) await deleteRemote(id);
          for (const e of get().entries.filter((x) => x.publishedAt == null)) await sync(e.id);
        } finally {
          syncing = false;
        }
      },
      async restore() {
        if (restoring) return 0;
        restoring = true;
        try {
          const remote = await gateway.restore();
          const deleting = new Set(await getRepo().pendingUnpublish()); // deleted here, the server hasn't heard yet
          let changed = 0;
          for (const r of remote) {
            if (deleting.has(r.id)) continue;
            const local = get().entries.find((x) => x.id === r.id);
            if (local && (local.publishedAt == null || (r.publishedAt ?? 0) <= local.publishedAt)) continue; // mine is newer or unsynced
            await put(await gateway.localize(r));
            changed++;
          }
          return changed;
        } finally {
          restoring = false;
        }
      },
      async resetForNewAccount() {
        const repo = getRepo();
        for (const id of await repo.pendingUnpublish()) await repo.unqueueUnpublish(id);
        await repo.replaceAll([]);
        set({ entries: [] });
      },
      async detachFromAccount() {
        const repo = getRepo();
        for (const id of await repo.pendingUnpublish()) await repo.unqueueUnpublish(id);
        for (const e of get().entries) {
          // Restored files are on the phone too, so only the server's keys and sync time are dropped.
          await put({
            ...e,
            publishedAt: null,
            photos: e.photos.map(({ remoteKey: _k, ...p }) => p),
            voices: e.voices.map(({ remoteKey: _k, ...v }) => v),
          });
        }
      },
    };
  });
}
