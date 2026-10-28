/** @jest-environment node */
import type { Entry } from '@/domain/types';
import { ApiError, type ApiClient } from './client';
import { createApiSharingGateway } from './apiSharingGateway';

const entry = (over: Partial<Entry> = {}): Entry => ({
  id: '11111111-1111-4111-8111-111111111111', createdAt: 1, date: '2026-10-08', time: '9:41 pm', mood: 33, feelings: ['lonely'],
  text: 'Made pasta', prompt: 'Who?', vis: 'friends', photos: [], voices: [], stickers: ['cozy'], publishedAt: null, ...over,
});

function setup(responses: Record<string, unknown> = {}) {
  const calls: { method: string; path: string; body?: unknown }[] = [];
  const api = {
    request: jest.fn(async (method: string, path: string, opts?: { body?: unknown }) => {
      calls.push({ method, path, body: opts?.body });
      const r = responses[`${method} ${path}`];
      if (r instanceof Error) throw r;
      if (typeof r === 'function') return (r as () => unknown)();
      if (method === 'POST' && path === '/media/upload-url') {
        const n = calls.filter((c) => c.path === '/media/upload-url').length;
        return { key: `u/${n}.bin`, uploadUrl: `http://media/upload/${n}`, fields: { public_id: `u/${n}`, signature: 'sig' }, fileField: 'file' };
      }
      return r ?? {};
    }),
  } as unknown as ApiClient;
  const puts: { url: string; method?: string; form: [string, unknown][] }[] = [];
  const fetchImpl = (async (url: string, init: RequestInit) => {
    puts.push({ url, method: init.method, form: (init.body as unknown as FakeForm).parts });
    return { ok: true, status: 200 } as Response;
  }) as unknown as typeof fetch;
  return { gw: createApiSharingGateway({ api, fetchImpl }), calls, puts };
}

/** Node's FormData flattens file descriptors to strings, so record the parts as given. */
class FakeForm {
  parts: [string, unknown][] = [];
  append(name: string, value: unknown) { this.parts.push([name, value]); }
}
const realFormData = globalThis.FormData;
beforeAll(() => { globalThis.FormData = FakeForm as never; });
afterAll(() => { globalThis.FormData = realFormData; });

describe('apiSharingGateway.publish', () => {
  it('saves the whole page to the account: content, visibility, mood, feelings and when it was written', async () => {
    const { gw, calls } = setup();
    await gw.publish(entry());
    expect(calls).toEqual([{
      method: 'PUT', path: '/posts/11111111-1111-4111-8111-111111111111',
      body: {
        date: '2026-10-08', time: '9:41 pm', vis: 'friends', prompt: 'Who?', text: 'Made pasta', stickers: ['cozy'],
        mood: 33, feelings: ['lonely'], createdAt: 1, photos: [], voices: [],
      },
    }]);
  });

  it('saves an Only me page the same way', async () => {
    const { gw, calls } = setup();
    await gw.publish(entry({ vis: 'private' }));
    expect(calls[0].body).toMatchObject({ vis: 'private', mood: 33, feelings: ['lonely'] });
  });

  it('takes publishedAt from the server’s clock when it answers with one', async () => {
    const { gw } = setup({ 'PUT /posts/11111111-1111-4111-8111-111111111111': () => ({ updatedAt: '2026-10-08T21:41:00.000Z' }) });
    expect((await gw.publish(entry())).publishedAt).toBe(Date.parse('2026-10-08T21:41:00.000Z'));
  });

  it('leaves publishedAt for the store to fill in when the server sends no time', async () => {
    const { gw } = setup();
    expect((await gw.publish(entry())).publishedAt).toBeNull();
  });

  it('uploads new photos and voice notes, then references their keys', async () => {
    const { gw, calls, puts } = setup();
    const out = await gw.publish(entry({
      photos: [{ id: 'p1', uri: 'file:///doc/media/a.jpg' }],
      voices: [{ id: 'v1', uri: 'file:///doc/media/b.m4a', seconds: 38 }],
    }));
    const uploads = calls.filter((c) => c.path === '/media/upload-url').map((c) => c.body);
    expect(uploads).toEqual([{ kind: 'photo', contentType: 'image/jpeg' }, { kind: 'voice', contentType: 'audio/mp4' }]);
    expect(puts).toEqual([
      {
        url: 'http://media/upload/1', method: 'POST',
        form: [['public_id', 'u/1'], ['signature', 'sig'], ['file', { uri: 'file:///doc/media/a.jpg', name: 'upload.jpg', type: 'image/jpeg' }]],
      },
      {
        url: 'http://media/upload/2', method: 'POST',
        form: [['public_id', 'u/2'], ['signature', 'sig'], ['file', { uri: 'file:///doc/media/b.m4a', name: 'upload.m4a', type: 'audio/mp4' }]],
      },
    ]);
    expect(calls[calls.length - 1].body).toMatchObject({ photos: ['u/1.bin'], voices: [{ key: 'u/2.bin', seconds: 38 }] });
    expect(out.photos[0].remoteKey).toBe('u/1.bin');
    expect(out.voices[0].remoteKey).toBe('u/2.bin');
  });

  it('does not upload files again once they have a remote key', async () => {
    const { gw, calls, puts } = setup();
    await gw.publish(entry({ photos: [{ id: 'p1', uri: 'file:///a.png', remoteKey: 'u/old.png' }] }));
    expect(calls.some((c) => c.path === '/media/upload-url')).toBe(false);
    expect(puts).toHaveLength(0);
    expect(calls[0].body).toMatchObject({ photos: ['u/old.png'] });
  });

  it('skips placeholder media that has no file (demo data)', async () => {
    const { gw, calls } = setup();
    const out = await gw.publish(entry({ photos: [{ id: 'p', uri: '', label: 'photo · river' }], voices: [{ id: 'v', uri: '', seconds: 38 }] }));
    expect(calls).toHaveLength(1);
    expect(calls[0].body).toMatchObject({ photos: [], voices: [] });
    expect(out.photos[0].remoteKey).toBeUndefined();
  });

  it('picks the content type from the file extension', async () => {
    const { gw, calls } = setup();
    await gw.publish(entry({ photos: [{ id: 'a', uri: 'file:///x.PNG' }, { id: 'b', uri: 'file:///y.webp' }, { id: 'c', uri: 'file:///z' }] }));
    expect(calls.filter((c) => c.path === '/media/upload-url').map((c) => (c.body as { contentType: string }).contentType))
      .toEqual(['image/png', 'image/webp', 'image/jpeg']);
  });

  it('fails if the storage upload is rejected, without publishing the page', async () => {
    const { calls } = setup();
    const api = { request: jest.fn(async (m: string, p: string) => (p === '/media/upload-url' ? { key: 'k', uploadUrl: 'http://media/upload', fields: {}, fileField: 'file' } : {})) } as unknown as ApiClient;
    const gw = createApiSharingGateway({ api, fetchImpl: (async () => ({ ok: false, status: 403 })) as never });
    await expect(gw.publish(entry({ photos: [{ id: 'p', uri: 'file:///a.jpg' }] }))).rejects.toThrow();
    expect((api.request as jest.Mock).mock.calls.some((c) => c[0] === 'PUT')).toBe(false);
    expect(calls).toHaveLength(0);
  });

  it('re-uploads and retries once if the server no longer knows the remembered files', async () => {
    let first = true;
    const { gw, calls } = setup({
      'PUT /posts/11111111-1111-4111-8111-111111111111': () => {
        if (first) { first = false; throw new ApiError(400, { message: 'Attached media must be your own uploads' }); }
        return {};
      },
    });
    const out = await gw.publish(entry({ photos: [{ id: 'p1', uri: 'file:///a.jpg', remoteKey: 'stale' }] }));
    const puts = calls.filter((c) => c.method === 'PUT');
    expect(puts).toHaveLength(2);
    expect(puts[1].body).toMatchObject({ photos: ['u/1.bin'] });
    expect(out.photos[0].remoteKey).toBe('u/1.bin');
  });

  it('lets other API errors through', async () => {
    const { gw } = setup({ 'PUT /posts/11111111-1111-4111-8111-111111111111': new ApiError(500, {}) });
    await expect(gw.publish(entry())).rejects.toMatchObject({ status: 500 });
  });
});

const own = (over: Record<string, unknown> = {}) => ({
  id: '22222222-2222-4222-8222-222222222222', date: '2026-10-05', time: '10:05 pm', vis: 'private', prompt: 'Who?', text: 'Quiet night',
  stickers: ['cozy'], mood: 20, feelings: ['tired'], photos: [{ key: 'u1/p.jpg', url: 'https://res/p' }], voices: [{ key: 'u1/v.m4a', url: 'https://res/v', seconds: 12 }],
  createdAt: '2026-10-05T22:05:00.000Z', updatedAt: '2026-10-06T08:00:00.000Z', ...over,
});

describe('apiSharingGateway.restore', () => {
  it('turns the account’s pages into entries, keeping mood, feelings, visibility and the uploaded files', async () => {
    const { gw } = setup({ 'GET /me/posts?limit=50': { posts: [own()], nextBefore: null } });
    const [e] = await gw.restore();
    expect(e).toEqual({
      id: '22222222-2222-4222-8222-222222222222', createdAt: Date.parse('2026-10-05T22:05:00.000Z'), date: '2026-10-05', time: '10:05 pm',
      mood: 20, feelings: ['tired'], text: 'Quiet night', prompt: 'Who?', vis: 'private', stickers: ['cozy'],
      photos: [{ id: 'u1/p.jpg', uri: 'https://res/p', remoteKey: 'u1/p.jpg' }],
      voices: [{ id: 'u1/v.m4a', uri: 'https://res/v', seconds: 12, remoteKey: 'u1/v.m4a' }],
      publishedAt: Date.parse('2026-10-06T08:00:00.000Z'),
    });
  });

  it('follows the paging cursor until the journal is complete', async () => {
    const { gw, calls } = setup({
      'GET /me/posts?limit=50': { posts: [own({ id: 'a' })], nextBefore: '2026-10-05T22:05:00.000Z_aaaa' },
      'GET /me/posts?limit=50&before=2026-10-05T22%3A05%3A00.000Z_aaaa': { posts: [own({ id: 'b' })], nextBefore: null },
    });
    expect((await gw.restore()).map((e) => e.id)).toEqual(['a', 'b']);
    expect(calls.map((c) => c.path)).toHaveLength(2);
  });

  it('gives a page without a mood a neutral one, and lets a failed request through', async () => {
    const { gw } = setup({ 'GET /me/posts?limit=50': { posts: [own({ mood: null })], nextBefore: null } });
    expect((await gw.restore())[0].mood).toBe(50);
    const offline = setup({ 'GET /me/posts?limit=50': new ApiError(0, {}) });
    await expect(offline.gw.restore()).rejects.toMatchObject({ status: 0 });
  });
});

describe('apiSharingGateway.localize', () => {
  const restored = (): Entry => ({
    ...entry({ vis: 'private' }),
    photos: [{ id: 'u1/p.jpg', uri: 'https://res/p', remoteKey: 'u1/p.jpg' }],
    voices: [{ id: 'u1/v.m4a', uri: 'https://res/v', seconds: 12, remoteKey: 'u1/v.m4a' }],
  });

  it('saves each photo and voice note onto the phone and points the page at the local files', async () => {
    const download = jest.fn(async (_url: string, id: string, ext: string) => `file:///doc/media/${id}.${ext}`);
    const gw = createApiSharingGateway({ api: {} as ApiClient, download });
    const out = await gw.localize(restored());
    expect(download).toHaveBeenCalledWith('https://res/p', 'u1_p', 'jpg');
    expect(download).toHaveBeenCalledWith('https://res/v', 'u1_v', 'm4a');
    expect(out.photos[0]).toEqual({ id: 'u1/p.jpg', uri: 'file:///doc/media/u1_p.jpg', remoteKey: 'u1/p.jpg' });
    expect(out.voices[0].uri).toBe('file:///doc/media/u1_v.m4a');
  });

  it('keeps the remote link for a file that can’t be downloaded, and skips files already on the phone', async () => {
    const download = jest.fn(async (url: string) => { if (url.endsWith('/p')) throw new Error('offline'); return 'file:///doc/media/v.m4a'; });
    const gw = createApiSharingGateway({ api: {} as ApiClient, download });
    const out = await gw.localize(restored());
    expect(out.photos[0].uri).toBe('https://res/p');
    expect(out.voices[0].uri).toBe('file:///doc/media/v.m4a');
    download.mockClear();
    await gw.localize({ ...restored(), photos: [{ id: 'x', uri: 'file:///doc/media/x.jpg', remoteKey: 'u1/x.jpg' }], voices: [] });
    expect(download).not.toHaveBeenCalled();
  });
});

describe('apiSharingGateway.unpublish', () => {
  it('deletes the page on the server', async () => {
    const { gw, calls } = setup();
    await gw.unpublish('abc');
    expect(calls).toEqual([{ method: 'DELETE', path: '/posts/abc', body: undefined }]);
  });
});
