import type { SharingGateway } from '@/data/sharing';
import type { Entry } from '@/domain/types';
import { ApiError, type ApiClient } from './client';

const PHOTO_TYPES: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', heic: 'image/heic' };
const VOICE_TYPES: Record<string, string> = { m4a: 'audio/mp4', mp4: 'audio/mp4', mp3: 'audio/mpeg', aac: 'audio/aac' };

const extOf = (uri: string) => /\.(\w{2,5})(?:\?|$)/.exec(uri)?.[1]?.toLowerCase() ?? '';
const contentType = (kind: 'photo' | 'voice', uri: string) =>
  (kind === 'photo' ? PHOTO_TYPES : VOICE_TYPES)[extOf(uri)] ?? (kind === 'photo' ? 'image/jpeg' : 'audio/mp4');

interface Deps {
  api: ApiClient;
  fetchImpl?: typeof fetch;
  readFile?: (uri: string) => Promise<Blob>;
}

/** Publishes pages to journ-al-be. Only the shareable fields are sent: never mood or feelings. */
export function createApiSharingGateway({ api, fetchImpl, readFile }: Deps): SharingGateway {
  const read = readFile ?? (async (uri: string) => (await fetch(uri)).blob());

  async function upload(kind: 'photo' | 'voice', uri: string): Promise<string> {
    const ct = contentType(kind, uri);
    const slot = await api.request<{ key: string; uploadUrl: string; headers: Record<string, string> }>('POST', '/media/upload-url', {
      body: { kind, contentType: ct },
    });
    const res = await (fetchImpl ?? fetch)(slot.uploadUrl, { method: 'PUT', headers: slot.headers, body: await read(uri) });
    if (!res.ok) throw new Error(`Upload failed (${res.status})`);
    return slot.key;
  }

  /** Make sure every real file has a server copy; `fresh` ignores remembered keys. */
  async function withKeys(entry: Entry, fresh: boolean): Promise<Entry> {
    const photos = [];
    for (const p of entry.photos) {
      if (!p.uri) { photos.push(p); continue; } // demo placeholder: nothing to upload
      photos.push({ ...p, remoteKey: !fresh && p.remoteKey ? p.remoteKey : await upload('photo', p.uri) });
    }
    const voices = [];
    for (const v of entry.voices) {
      if (!v.uri) { voices.push(v); continue; }
      voices.push({ ...v, remoteKey: !fresh && v.remoteKey ? v.remoteKey : await upload('voice', v.uri) });
    }
    return { ...entry, photos, voices };
  }

  const put = (e: Entry) =>
    api.request('PUT', `/posts/${e.id}`, {
      body: {
        date: e.date, time: e.time, vis: e.vis, prompt: e.prompt, text: e.text, stickers: e.stickers,
        photos: e.photos.flatMap((p) => (p.remoteKey ? [p.remoteKey] : [])),
        voices: e.voices.flatMap((v) => (v.remoteKey ? [{ key: v.remoteKey, seconds: v.seconds }] : [])),
      },
    });

  return {
    async publish(entry) {
      const remembered = entry.photos.some((p) => p.remoteKey) || entry.voices.some((v) => v.remoteKey);
      let prepared = await withKeys(entry, false);
      try {
        await put(prepared);
      } catch (e) {
        // The server may have dropped our remembered files (e.g. after the page was unpublished): upload again once.
        if (!(remembered && e instanceof ApiError && e.status === 400)) throw e;
        prepared = await withKeys(entry, true);
        await put(prepared);
      }
      return prepared;
    },
    async unpublish(entryId) {
      await api.request('DELETE', `/posts/${entryId}`);
    },
  };
}
