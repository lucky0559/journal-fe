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
    restore: jest.fn(async (): Promise<Entry[]> => []),
    localize: jest.fn(async (e: Entry) => e),
    ...gw,
  };
  const useStore = createEntriesStore(() => repo, gateway, () => 777);
  return { useStore, gateway, saved, queue };
}

/** Save, then wait for the background save to the account to finish. */
const saveAndSync = async (s: ReturnType<typeof setup>, e: Entry) => {
  await s.useStore.getState().save(e);
  await s.useStore.getState().idle();
};

describe('entriesStore basics', () => {
  it('sorts by date desc then createdAt desc', () => {
    const out = sortEntries([entry({ id: 'a', date: '2026-10-01' }), entry({ id: 'b', date: '2026-10-07', createdAt: 1 }), entry({ id: 'c', date: '2026-10-07', createdAt: 2 })]);
    expect(out.map((e) => e.id)).toEqual(['c', 'b', 'a']);
  });

  it('saves locally, keeping the list sorted and de-duplicated', async () => {
    const s = setup();
    await saveAndSync(s, entry({ id: 'a', text: 'one' }));
    await saveAndSync(s, entry({ id: 'a', text: 'two' }));
    expect(s.useStore.getState().entries).toHaveLength(1);
    expect(s.useStore.getState().entries[0].text).toBe('two');
  });

  it('loads from the repo', async () => {
    const { useStore, saved } = setup();
    saved.set('z', entry({ id: 'z' }));
    await useStore.getState().load();
    expect(useStore.getState()).toMatchObject({ loaded: true });
    expect(useStore.getState().entries.map((e) => e.id)).toEqual(['z']);
  });
});

describe('saving to the account', () => {
  it('saves every page, Only me ones too, and records when it synced', async () => {
    const s = setup();
    await saveAndSync(s, entry({ id: 'p', vis: 'private' }));
    await saveAndSync(s, entry({ id: 'f', vis: 'friends' }));
    expect(s.gateway.publish).toHaveBeenCalledTimes(2);
    expect(s.saved.get('p')!.publishedAt).toBe(777);
    expect(s.useStore.getState().entries.find((e) => e.id === 'f')!.publishedAt).toBe(777);
  });

  it('uses the server’s time when the gateway reports it', async () => {
    const s = setup({ publish: jest.fn(async (e: Entry) => ({ ...e, publishedAt: 5000 })) });
    await saveAndSync(s, entry());
    expect(s.saved.get('a')!.publishedAt).toBe(5000);
  });

  it('returns as soon as the page is on the phone, while the upload carries on', async () => {
    let release: () => void = () => {};
    const gate = new Promise<void>((r) => { release = r; });
    const s = setup({ publish: jest.fn(async (e: Entry) => { await gate; return e; }) });
    await s.useStore.getState().save(entry({ text: 'hello' }));
    expect(s.saved.get('a')).toMatchObject({ text: 'hello', publishedAt: null }); // stored, not yet synced
    release();
    await s.useStore.getState().idle();
    expect(s.saved.get('a')!.publishedAt).toBe(777);
  });

  it('stores the remote media keys the gateway returns', async () => {
    const s = setup({
      publish: jest.fn(async (e: Entry) => ({ ...e, photos: e.photos.map((p) => ({ ...p, remoteKey: 'u/1.jpg' })) })),
    });
    await saveAndSync(s, entry({ vis: 'public', photos: [{ id: 'p', uri: 'file:///x.jpg' }] }));
    expect(s.saved.get('a')!.photos[0].remoteKey).toBe('u/1.jpg');
  });

  it('keeps the local save and leaves the page pending when saving fails', async () => {
    const s = setup({ publish: jest.fn(async () => { throw new Error('offline'); }) });
    await expect(saveAndSync(s, entry({ vis: 'public' }))).resolves.toBeUndefined();
    expect(s.saved.get('a')).toBeDefined();
    expect(s.saved.get('a')!.publishedAt).toBeNull();
  });

  it('an edit to a synced page is pending again until it syncs', async () => {
    const s = setup({ publish: jest.fn(async () => { throw new Error('offline'); }) });
    await saveAndSync(s, entry({ vis: 'public', publishedAt: 500 }));
    expect(s.saved.get('a')!.publishedAt).toBeNull();
  });

  it('never lets an older upload overwrite an edit made while it was uploading', async () => {
    let release: () => void = () => {};
    const gate = new Promise<void>((r) => { release = r; });
    const sentTexts: string[] = [];
    const s = setup({
      publish: jest.fn(async (e: Entry) => {
        sentTexts.push(e.text);
        if (sentTexts.length === 1) await gate; // the first upload is slow
        return { ...e, photos: e.photos.map((p) => ({ ...p, remoteKey: `k-${p.id}` })) };
      }),
    });
    await s.useStore.getState().save(entry({ text: 'one', photos: [{ id: 'p', uri: 'file:///x.jpg' }] }));
    await s.useStore.getState().save(entry({ text: 'two', photos: [{ id: 'p', uri: 'file:///x.jpg' }] })); // edit while uploading
    release();
    await s.useStore.getState().idle();
    expect(sentTexts).toEqual(['one', 'two']); // the newest version goes last
    expect(s.saved.get('a')).toMatchObject({ text: 'two', publishedAt: 777 });
    expect(s.useStore.getState().entries[0].text).toBe('two');
  });

  it('flipping a page to Only me saves it as private and deletes nothing', async () => {
    const s = setup();
    await saveAndSync(s, entry({ vis: 'public', photos: [{ id: 'p', uri: 'file:///x.jpg', remoteKey: 'u/1.jpg' }] }));
    await saveAndSync(s, { ...s.useStore.getState().entries[0], vis: 'private' });
    expect(s.gateway.unpublish).not.toHaveBeenCalled();
    expect(s.gateway.publish).toHaveBeenLastCalledWith(expect.objectContaining({ vis: 'private' }));
    expect(s.saved.get('a')!.photos[0].remoteKey).toBe('u/1.jpg'); // the uploaded copy stays attached
  });

  it('saving a page cancels a pending deletion of it', async () => {
    const s = setup();
    s.queue.add('a');
    await saveAndSync(s, entry());
    expect(s.queue.has('a')).toBe(false);
  });
});

describe('syncPending', () => {
  it('retries queued deletions first, then every page that is not synced, whatever its visibility', async () => {
    const calls: string[] = [];
    const s = setup({
      publish: jest.fn(async (e: Entry) => { calls.push(`publish ${e.id}`); return e; }),
      unpublish: jest.fn(async (id: string) => { calls.push(`delete ${id}`); }),
    });
    s.saved.set('shared', entry({ id: 'shared', vis: 'public', publishedAt: null, createdAt: 3 }));
    s.saved.set('private', entry({ id: 'private', vis: 'private', publishedAt: null, createdAt: 2 }));
    s.saved.set('synced', entry({ id: 'synced', vis: 'public', publishedAt: 5, createdAt: 1 }));
    s.queue.add('gone');
    await s.useStore.getState().load();
    await s.useStore.getState().syncPending();
    expect(calls).toEqual(['delete gone', 'publish shared', 'publish private']);
    expect(s.queue.size).toBe(0);
    expect(s.saved.get('shared')!.publishedAt).toBe(777);
    expect(s.saved.get('private')!.publishedAt).toBe(777);
  });

  it('keeps going after one page fails', async () => {
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

  it('leaves pages that are already synced alone', async () => {
    const s = setup();
    s.saved.set('done', entry({ id: 'done', publishedAt: 1 }));
    await s.useStore.getState().load();
    await s.useStore.getState().syncPending();
    expect(s.gateway.publish).not.toHaveBeenCalled();
  });
});

describe('restore (signing in on another phone)', () => {
  const remote = (over: Partial<Entry> = {}) => entry({ vis: 'private', publishedAt: 1000, ...over });

  it('brings in pages this phone does not have, with their files saved onto the phone', async () => {
    const s = setup({
      restore: jest.fn(async () => [remote({ id: 'r', text: 'from my old phone', photos: [{ id: 'k', uri: 'https://x/k', remoteKey: 'k' }] })]),
      localize: jest.fn(async (e: Entry) => ({ ...e, photos: e.photos.map((p) => ({ ...p, uri: 'file:///doc/media/k.jpg' })) })),
    });
    expect(await s.useStore.getState().restore()).toBe(1);
    expect(s.saved.get('r')).toMatchObject({ text: 'from my old phone', publishedAt: 1000, vis: 'private' });
    expect(s.saved.get('r')!.photos[0].uri).toBe('file:///doc/media/k.jpg');
    expect(s.useStore.getState().entries.map((e) => e.id)).toEqual(['r']);
    expect(s.gateway.publish).not.toHaveBeenCalled(); // restoring never uploads
  });

  it('takes a newer version from another phone, but keeps pages that are up to date', async () => {
    const s = setup({ restore: jest.fn(async () => [remote({ id: 'newer', text: 'edited elsewhere', publishedAt: 2000 }), remote({ id: 'same', text: 'server copy', publishedAt: 1000 })]) });
    s.saved.set('newer', entry({ id: 'newer', text: 'old', publishedAt: 1000 }));
    s.saved.set('same', entry({ id: 'same', text: 'mine', publishedAt: 1000 }));
    await s.useStore.getState().load();
    expect(await s.useStore.getState().restore()).toBe(1);
    expect(s.saved.get('newer')!.text).toBe('edited elsewhere');
    expect(s.saved.get('same')!.text).toBe('mine');
  });

  it('never overwrites a page that has changes not saved yet', async () => {
    const s = setup({ restore: jest.fn(async () => [remote({ id: 'a', text: 'server', publishedAt: 9000 })]) });
    s.saved.set('a', entry({ id: 'a', text: 'my unsynced edit', publishedAt: null }));
    await s.useStore.getState().load();
    expect(await s.useStore.getState().restore()).toBe(0);
    expect(s.saved.get('a')!.text).toBe('my unsynced edit');
  });

  it('does not bring back a page that was deleted here and is waiting to be deleted on the server', async () => {
    const s = setup({ restore: jest.fn(async () => [remote({ id: 'gone' })]) });
    s.queue.add('gone');
    expect(await s.useStore.getState().restore()).toBe(0);
    expect(s.saved.has('gone')).toBe(false);
  });

  it('does nothing while another restore is running, and passes failures on to the caller', async () => {
    let release: () => void = () => {};
    const gate = new Promise<void>((r) => { release = r; });
    const s = setup({ restore: jest.fn(async () => { await gate; return []; }) });
    const first = s.useStore.getState().restore();
    expect(await s.useStore.getState().restore()).toBe(0);
    release();
    await first;
    expect(s.gateway.restore).toHaveBeenCalledTimes(1);
    const offline = setup({ restore: jest.fn(async () => { throw new Error('offline'); }) });
    await expect(offline.useStore.getState().restore()).rejects.toThrow('offline');
  });
});

describe('resetForNewAccount (a different Google account signed in on this phone)', () => {
  it('clears the journal and the queue without touching the server', async () => {
    const s = setup();
    s.saved.set('f', entry({ id: 'f', vis: 'friends', publishedAt: 5 }));
    s.saved.set('p', entry({ id: 'p', vis: 'private', publishedAt: null }));
    s.queue.add('old');
    await s.useStore.getState().load();
    await s.useStore.getState().resetForNewAccount();
    expect(s.saved.size).toBe(0);
    expect(s.useStore.getState().entries).toEqual([]);
    expect(s.queue.size).toBe(0);
    expect(s.gateway.publish).not.toHaveBeenCalled();
    expect(s.gateway.unpublish).not.toHaveBeenCalled();
  });
});

describe('detachFromAccount (the account was deleted)', () => {
  it('keeps every page and its files on the phone but forgets the server copies', async () => {
    const s = setup();
    s.saved.set('f', entry({ id: 'f', vis: 'friends', publishedAt: 5, photos: [{ id: 'p', uri: 'file:///doc/media/p.jpg', remoteKey: 'k' }] }));
    s.queue.add('old');
    await s.useStore.getState().load();
    await s.useStore.getState().detachFromAccount();
    expect(s.saved.get('f')).toMatchObject({ vis: 'friends', publishedAt: null });
    expect(s.saved.get('f')!.photos[0]).toEqual({ id: 'p', uri: 'file:///doc/media/p.jpg' });
    expect(s.queue.size).toBe(0);
    expect(s.gateway.unpublish).not.toHaveBeenCalled();
  });
});

describe('dropLocal', () => {
  it('removes pages from the phone without asking the server or queueing anything', async () => {
    const s = setup();
    s.saved.set('a', entry({ id: 'a', publishedAt: 5 }));
    s.saved.set('b', entry({ id: 'b', publishedAt: null }));
    await s.useStore.getState().load();
    await s.useStore.getState().dropLocal(['a']);
    expect(s.useStore.getState().entries.map((e) => e.id)).toEqual(['b']);
    expect([...s.saved.keys()]).toEqual(['b']);
    expect(s.gateway.unpublish).not.toHaveBeenCalled();
    expect(s.queue.size).toBe(0);
  });
});

describe('replaceAll', () => {
  it('queues deleting the synced pages it removes, and ignores pages that never reached the server', async () => {
    const s = setup();
    s.saved.set('synced', entry({ id: 'synced', publishedAt: 5 }));
    s.saved.set('local', entry({ id: 'local', publishedAt: null }));
    await s.useStore.getState().load();
    await s.useStore.getState().replaceAll([entry({ id: 'new' })]);
    expect(s.gateway.unpublish).toHaveBeenCalledTimes(1);
    expect(s.gateway.unpublish).toHaveBeenCalledWith('synced');
    expect(s.useStore.getState().entries.map((e) => e.id)).toEqual(['new']);
  });
});
