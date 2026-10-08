/** @jest-environment node */
import type { Entry } from '@/domain/types';
import type { EntryRepo } from '@/data/entryRepo';
import type { SharingGateway } from '@/data/sharing';
import { createEntriesStore, sortEntries } from './entriesStore';

const entry = (over: Partial<Entry> = {}): Entry => ({
  id: 'a', createdAt: 1, date: '2026-10-07', time: '9:00 pm', mood: 50, feelings: [], text: 'x', prompt: '',
  vis: 'private', photos: [], voices: [], stickers: [], ...over,
});

function setup(gatewayOverrides: Partial<SharingGateway> = {}) {
  const saved = new Map<string, Entry>();
  const repo: EntryRepo = {
    list: async () => [...saved.values()],
    upsert: async (e) => { saved.set(e.id, e); },
    replaceAll: async (es) => { saved.clear(); es.forEach((e) => saved.set(e.id, e)); },
  };
  const gateway = { publish: jest.fn(async () => {}), unpublish: jest.fn(async () => {}), ...gatewayOverrides };
  const useStore = createEntriesStore(() => repo, gateway);
  return { useStore, gateway, saved };
}

describe('entriesStore', () => {
  it('sorts by date desc then createdAt desc', () => {
    const out = sortEntries([entry({ id: 'a', date: '2026-10-01' }), entry({ id: 'b', date: '2026-10-07', createdAt: 1 }), entry({ id: 'c', date: '2026-10-07', createdAt: 2 })]);
    expect(out.map((e) => e.id)).toEqual(['c', 'b', 'a']);
  });

  it('saves locally and keeps the list sorted and de-duplicated', async () => {
    const { useStore } = setup();
    await useStore.getState().save(entry({ id: 'a', text: 'one' }));
    await useStore.getState().save(entry({ id: 'a', text: 'two' }));
    expect(useStore.getState().entries).toHaveLength(1);
    expect(useStore.getState().entries[0].text).toBe('two');
  });

  it('never publishes or unpublishes a brand-new private page', async () => {
    const { useStore, gateway } = setup();
    await useStore.getState().save(entry({ vis: 'private' }));
    expect(gateway.publish).not.toHaveBeenCalled();
    expect(gateway.unpublish).not.toHaveBeenCalled();
  });

  it('publishes friends and public pages', async () => {
    const { useStore, gateway } = setup();
    await useStore.getState().save(entry({ id: 'f', vis: 'friends' }));
    await useStore.getState().save(entry({ id: 'p', vis: 'public' }));
    expect(gateway.publish).toHaveBeenCalledTimes(2);
  });

  it('unpublishes when a shared page is flipped back to private, and never publishes it again', async () => {
    const { useStore, gateway } = setup();
    await useStore.getState().save(entry({ vis: 'public' }));
    (gateway.publish as jest.Mock).mockClear();
    await useStore.getState().save(entry({ vis: 'private' }));
    expect(gateway.unpublish).toHaveBeenCalledWith('a');
    expect(gateway.publish).not.toHaveBeenCalled();
  });

  it('keeps the local save when the gateway fails', async () => {
    const { useStore, saved } = setup({ publish: async () => { throw new Error('offline'); } });
    await expect(useStore.getState().save(entry({ vis: 'public' }))).resolves.toBeUndefined();
    expect(saved.get('a')).toBeDefined();
    expect(useStore.getState().entries).toHaveLength(1);
  });

  it('loads from the repo', async () => {
    const { useStore, saved } = setup();
    saved.set('z', entry({ id: 'z' }));
    await useStore.getState().load();
    expect(useStore.getState()).toMatchObject({ loaded: true });
    expect(useStore.getState().entries.map((e) => e.id)).toEqual(['z']);
  });
});
