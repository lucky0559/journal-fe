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
        return { key: `u/${n}.bin`, uploadUrl: `http://r2/put/${n}`, headers: { 'Content-Type': (opts?.body as { contentType: string }).contentType } };
      }
      return r ?? {};
    }),
  } as unknown as ApiClient;
  const puts: { url: string; headers: Record<string, string>; body: unknown }[] = [];
  const fetchImpl = (async (url: string, init: RequestInit) => {
    puts.push({ url, headers: init.headers as Record<string, string>, body: init.body });
    return { ok: true, status: 200 } as Response;
  }) as unknown as typeof fetch;
  const readFile = jest.fn(async (uri: string) => `bytes:${uri}`);
  return { gw: createApiSharingGateway({ api, fetchImpl, readFile: readFile as never }), calls, puts, readFile };
}

describe('apiSharingGateway.publish', () => {
  it('puts only shareable fields: no mood, no feelings, no local ids', async () => {
    const { gw, calls } = setup();
    await gw.publish(entry());
    expect(calls).toEqual([{
      method: 'PUT', path: '/posts/11111111-1111-4111-8111-111111111111',
      body: { date: '2026-10-08', time: '9:41 pm', vis: 'friends', prompt: 'Who?', text: 'Made pasta', stickers: ['cozy'], photos: [], voices: [] },
    }]);
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
      { url: 'http://r2/put/1', headers: { 'Content-Type': 'image/jpeg' }, body: 'bytes:file:///doc/media/a.jpg' },
      { url: 'http://r2/put/2', headers: { 'Content-Type': 'audio/mp4' }, body: 'bytes:file:///doc/media/b.m4a' },
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
    const api = { request: jest.fn(async (m: string, p: string) => (p === '/media/upload-url' ? { key: 'k', uploadUrl: 'http://r2/put', headers: {} } : {})) } as unknown as ApiClient;
    const gw = createApiSharingGateway({ api, fetchImpl: (async () => ({ ok: false, status: 403 })) as never, readFile: (async () => 'b') as never });
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

describe('apiSharingGateway.unpublish', () => {
  it('deletes the page on the server', async () => {
    const { gw, calls } = setup();
    await gw.unpublish('abc');
    expect(calls).toEqual([{ method: 'DELETE', path: '/posts/abc', body: undefined }]);
  });
});
