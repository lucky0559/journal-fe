/** @jest-environment node */
import type { Entry } from '@/domain/types';
import type { EntryRepo } from '@/data/entryRepo';
import type { SharingGateway } from '@/data/sharing';
import { createEntriesStore, sortEntries } from './entriesStore';

const entry = (over: Partial<Entry> = {}): Entry => ({
  id: 'a', createdAt: 1, date: '2026-10-07', time: '9:00 pm', mood: 50, feelings: [], text: 'x', prompt: '',
  vis: 'private', photos: [], voices: [], stickers: [], publishedAt: null, ...over,
});

function setup(gw: Partial<SharingGateway> = {}) {
  const saved = new Map<string, Entry>();
  const queue = new Set<string>();
  const repo: EntryRepo = {
    list: async () => [...saved.values()],
    upsert: async (e) => { saved.set(e.id, e); },
    replaceAll: async (es) => { saved.clear(); es.forEach((e) => saved.set(e.id, e)); },
    queueUnpublish: async (id) => { queue.add(id); },
    unqueueUnpublish: async (id) => { queue.delete(id); },
    pendingUnpublish: async () => [...queue],
  };
  const gateway = {
    publish: jest.fn(async (e: Entry) => e),
    unpublish: jest.fn(async (_id: string) => {}),
    ...gw,
  };
  const useStore = createEntriesStore(() => repo, gateway, () => 777);
  return { useStore, gateway, saved, queue };
}

describe('entriesStore basics', () => {
  it('sorts by date desc then createdAt desc', () => {
    const out = sortEntries([entry({ id: 'a', date: '2026-10-01' }), entry({ id: 'b', date: '2026-10-07', createdAt: 1 }), entry({ id: 'c', date: '2026-10-07', createdAt: 2 })]);
    expect(out.map((e) => e.id)).toEqual(['c', 'b', 'a']);
  });

  it('saves locally, keeping the list sorted and de-duplicated', async () => {
    const { useStore } = setup();
    await useStore.getState().save(entry({ id: 'a', text: 'one' }));
    await useStore.getState().save(entry({ id: 'a', text: 'two' }));
    expect(useStore.getState().entries).toHaveLength(1);
    expect(useStore.getState().entries[0].text).toBe('two');
  });

  it('loads from the repo', async () => {
    const { useStore, saved } = setup();
    saved.set('z', entry({ id: 'z' }));
    await useStore.getState().load();
    expect(useStore.getState()).toMatchObject({ loaded: true });
    expect(useStore.getState().entries.map((e) => e.id)).toEqual(['z']);
  });
});

describe('publishing', () => {
  it('never contacts the server for a page that has only ever been private', async () => {
    const { useStore, gateway, queue } = setup();
    await useStore.getState().save(entry({ vis: 'private' }));
    await useStore.getState().save(entry({ vis: 'private', text: 'edited' }));
    expect(gateway.publish).not.toHaveBeenCalled();
    expect(gateway.unpublish).not.toHaveBeenCalled();
    expect(queue.size).toBe(0);
  });

  it('publishes friends and public pages and records when they synced', async () => {
    const { useStore, gateway, saved } = setup();
    await useStore.getState().save(entry({ id: 'f', vis: 'friends' }));
    expect(gateway.publish).toHaveBeenCalledTimes(1);
    expect(saved.get('f')!.publishedAt).toBe(777);
    expect(useStore.getState().entries[0].publishedAt).toBe(777);
  });

  it('stores the remote media keys the gateway returns', async () => {
    const { useStore, saved } = setup({
      publish: jest.fn(async (e: Entry) => ({ ...e, photos: e.photos.map((p) => ({ ...p, remoteKey: 'u/1.jpg' })) })),
    });
    await useStore.getState().save(entry({ vis: 'public', photos: [{ id: 'p', uri: 'file:///x.jpg' }] }));
    expect(saved.get('a')!.photos[0].remoteKey).toBe('u/1.jpg');
  });

  it('keeps the local save and leaves the page pending when publishing fails', async () => {
    const { useStore, saved } = setup({ publish: jest.fn(async () => { throw new Error('offline'); }) });
    await expect(useStore.getState().save(entry({ vis: 'public' }))).resolves.toBeUndefined();
    expect(saved.get('a')).toBeDefined();
    expect(saved.get('a')!.publishedAt).toBeNull();
  });

  it('an edit to a synced page is pending again until it syncs', async () => {
    const { useStore, saved } = setup({ publish: jest.fn(async () => { throw new Error('offline'); }) });
    await useStore.getState().save(entry({ vis: 'public', publishedAt: 500 }));
    expect(saved.get('a')!.publishedAt).toBeNull();
  });
});

describe('flipping back to private', () => {
  it('unpublishes and strips the remote keys so a later re-share uploads fresh files', async () => {
    const { useStore, gateway, saved, queue } = setup();
    await useStore.getState().save(entry({ vis: 'public', photos: [{ id: 'p', uri: 'file:///x.jpg', remoteKey: 'u/1.jpg' }] }));
    await useStore.getState().save({ ...useStore.getState().entries[0], vis: 'private' });
    expect(gateway.unpublish).toHaveBeenCalledWith('a');
    expect(queue.size).toBe(0);
    expect(saved.get('a')).toMatchObject({ vis: 'private', publishedAt: null });
    expect(saved.get('a')!.photos[0].remoteKey).toBeUndefined();
    expect(gateway.publish).toHaveBeenCalledTimes(1); // only the earlier share
  });

  it('keeps the unpublish queued when offline, so it cannot be lost', async () => {
    const { useStore, queue } = setup();
    await useStore.getState().save(entry({ vis: 'friends' }));
    const failing = setup({ unpublish: jest.fn(async () => { throw new Error('offline'); }) });
    await failing.useStore.getState().save(entry({ vis: 'friends' }));
    await failing.useStore.getState().save({ ...failing.useStore.getState().entries[0], vis: 'private' });
    expect([...failing.queue]).toEqual(['a']);
    expect(queue.size).toBe(0);
  });

  it('re-sharing a page cancels its pending unpublish', async () => {
    const { useStore, queue } = setup({ unpublish: jest.fn(async () => { throw new Error('offline'); }) });
    await useStore.getState().save(entry({ vis: 'friends' }));
    await useStore.getState().save({ ...useStore.getState().entries[0], vis: 'private' });
    expect(queue.has('a')).toBe(true);
    await useStore.getState().save({ ...useStore.getState().entries[0], vis: 'public' });
    expect(queue.has('a')).toBe(false);
  });
});

describe('syncPending', () => {
  it('retries queued unpublishes and unsynced shared pages', async () => {
    const calls: string[] = [];
    const s = setup({
      publish: jest.fn(async (e: Entry) => { calls.push(`publish ${e.id}`); return e; }),
      unpublish: jest.fn(async (id: string) => { calls.push(`unpublish ${id}`); }),
    });
    s.saved.set('shared', entry({ id: 'shared', vis: 'public', publishedAt: null }));
    s.saved.set('synced', entry({ id: 'synced', vis: 'public', publishedAt: 5 }));
    s.saved.set('private', entry({ id: 'private', vis: 'private' }));
    s.queue.add('gone');
    await s.useStore.getState().load();
    await s.useStore.getState().syncPending();
    expect(calls).toEqual(['unpublish gone', 'publish shared']);
    expect(s.queue.size).toBe(0);
    expect(s.saved.get('shared')!.publishedAt).toBe(777);
  });

  it('unpublishes before publishing, and keeps going after one failure', async () => {
    const s = setup({
      publish: jest.fn(async (e: Entry) => { if (e.id === 'bad') throw new Error('x'); return e; }),
    });
    s.saved.set('bad', entry({ id: 'bad', vis: 'public', createdAt: 9 }));
    s.saved.set('good', entry({ id: 'good', vis: 'public', createdAt: 8 }));
    await s.useStore.getState().load();
    await s.useStore.getState().syncPending();
    expect(s.saved.get('good')!.publishedAt).toBe(777);
    expect(s.saved.get('bad')!.publishedAt).toBeNull();
  });

  it('does not run two syncs at once', async () => {
    let release: () => void = () => {};
    const gate = new Promise<void>((r) => { release = r; });
    const s = setup({ publish: jest.fn(async (e: Entry) => { await gate; return e; }) });
    s.saved.set('x', entry({ id: 'x', vis: 'public' }));
    await s.useStore.getState().load();
    const first = s.useStore.getState().syncPending();
    await s.useStore.getState().syncPending();
    release();
    await first;
    expect(s.gateway.publish).toHaveBeenCalledTimes(1);
  });
});

describe('resetSharing (a different Google account signed in on this phone)', () => {
  it('turns shared pages private locally, forgets sync state and clears the queue', async () => {
    const s = setup();
    s.saved.set('f', entry({ id: 'f', vis: 'friends', publishedAt: 5, photos: [{ id: 'p', uri: 'file:///x.jpg', remoteKey: 'k' }] }));
    s.saved.set('p', entry({ id: 'p', vis: 'private' }));
    s.queue.add('old');
    await s.useStore.getState().load();
    await s.useStore.getState().resetSharing();
    expect(s.saved.get('f')).toMatchObject({ vis: 'private', publishedAt: null });
    expect(s.saved.get('f')!.photos[0].remoteKey).toBeUndefined();
    expect(s.queue.size).toBe(0);
    expect(s.gateway.publish).not.toHaveBeenCalled();
    expect(s.gateway.unpublish).not.toHaveBeenCalled();
  });
});

describe('replaceAll', () => {
  it('queues unpublishing for shared pages it removes', async () => {
    const s = setup();
    s.saved.set('f', entry({ id: 'f', vis: 'friends' }));
    await s.useStore.getState().load();
    await s.useStore.getState().replaceAll([entry({ id: 'new' })]);
    expect(s.gateway.unpublish).toHaveBeenCalledWith('f');
    expect(s.useStore.getState().entries.map((e) => e.id)).toEqual(['new']);
  });
});
