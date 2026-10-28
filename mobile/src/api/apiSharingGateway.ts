import type { SharingGateway } from '@/data/sharing';
import { downloadMedia } from '@/data/mediaStore';
import type { Entry, Visibility } from '@/domain/types';
import { ApiError, type ApiClient } from './client';

const PHOTO_TYPES: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', heic: 'image/heic' };
const VOICE_TYPES: Record<string, string> = { m4a: 'audio/mp4', mp4: 'audio/mp4', mp3: 'audio/mpeg', aac: 'audio/aac' };

const extOf = (uri: string) => /\.(\w{2,5})(?:\?|$)/.exec(uri)?.[1]?.toLowerCase() ?? '';
const contentType = (kind: 'photo' | 'voice', uri: string) =>
  (kind === 'photo' ? PHOTO_TYPES : VOICE_TYPES)[extOf(uri)] ?? (kind === 'photo' ? 'image/jpeg' : 'audio/mp4');

interface Deps {
  api: ApiClient;
  fetchImpl?: typeof fetch;
  /** Saves a remote file onto the phone and returns its uri. */
  download?: (url: string, id: string, ext: string) => Promise<string>;
}

/** One of my own pages as `GET /me/posts` returns it (mood and feelings are only ever sent back to their author). */
interface OwnPost {
  id: string; date: string; time: string; vis: Visibility; prompt: string; text: string; stickers: string[];
  mood: number | null; feelings: string[];
  photos: { key: string; url: string }[]; voices: { key: string; url: string; seconds: number }[];
  createdAt: string; updatedAt: string;
}

const fromServer = (p: OwnPost): Entry => ({
  id: p.id, createdAt: Date.parse(p.createdAt), date: p.date, time: p.time, mood: p.mood ?? 50, feelings: p.feelings ?? [],
  text: p.text, prompt: p.prompt, vis: p.vis, stickers: p.stickers,
  photos: p.photos.map((x) => ({ id: x.key, uri: x.url, remoteKey: x.key })),
  voices: p.voices.map((v) => ({ id: v.key, uri: v.url, seconds: v.seconds, remoteKey: v.key })),
  publishedAt: Date.parse(p.updatedAt), // the server's clock, so every phone compares like with like
});

const isRemote = (uri: string) => /^https?:\/\//.test(uri);
const fileId = (key: string) => key.replace(/\.\w+$/, '').replace(/[^\w-]/g, '_');

interface UploadSlot {
  key: string;
  uploadUrl: string;
  fields: Record<string, string>;
  fileField: string;
}

/**
 * Keeps the whole journal in the account on journ-al-be: every page, including Only me ones with their mood and
 * feelings. The server only ever shows another person a page they are allowed to read, and never its mood or feelings.
 */
export function createApiSharingGateway({ api, fetchImpl, download = downloadMedia }: Deps): SharingGateway {
  async function upload(kind: 'photo' | 'voice', uri: string): Promise<string> {
    const type = contentType(kind, uri);
    const slot = await api.request<UploadSlot>('POST', '/media/upload-url', { body: { kind, contentType: type } });
    // Multipart form straight to the storage provider (signed by the server). React Native streams `{uri,name,type}` from disk.
    const form = new FormData();
    for (const [name, value] of Object.entries(slot.fields)) form.append(name, value);
    form.append(slot.fileField, { uri, name: `upload.${extOf(uri) || (kind === 'photo' ? 'jpg' : 'm4a')}`, type } as unknown as Blob);
    const res = await (fetchImpl ?? fetch)(slot.uploadUrl, { method: 'POST', body: form });
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
    api.request<{ updatedAt?: string }>('PUT', `/posts/${e.id}`, {
      body: {
        date: e.date, time: e.time, vis: e.vis, prompt: e.prompt, text: e.text, stickers: e.stickers,
        mood: e.mood, feelings: e.feelings, createdAt: e.createdAt,
        photos: e.photos.flatMap((p) => (p.remoteKey ? [p.remoteKey] : [])),
        voices: e.voices.flatMap((v) => (v.remoteKey ? [{ key: v.remoteKey, seconds: v.seconds }] : [])),
      },
    });

  return {
    async publish(entry) {
      const remembered = entry.photos.some((p) => p.remoteKey) || entry.voices.some((v) => v.remoteKey);
      let prepared = await withKeys(entry, false);
      let saved: { updatedAt?: string };
      try {
        saved = await put(prepared);
      } catch (e) {
        // The server may have dropped our remembered files (e.g. after the page was deleted): upload again once.
        if (!(remembered && e instanceof ApiError && e.status === 400)) throw e;
        prepared = await withKeys(entry, true);
        saved = await put(prepared);
      }
      const at = saved?.updatedAt ? Date.parse(saved.updatedAt) : NaN;
      return Number.isFinite(at) ? { ...prepared, publishedAt: at } : prepared;
    },
    async unpublish(entryId) {
      await api.request('DELETE', `/posts/${entryId}`);
    },
    async restore() {
      const pages: Entry[] = [];
      let before: string | null = null;
      do {
        const res: { posts: OwnPost[]; nextBefore: string | null } = await api.request('GET', `/me/posts?limit=50${before ? `&before=${encodeURIComponent(before)}` : ''}`);
        pages.push(...res.posts.map(fromServer));
        before = res.nextBefore;
      } while (before);
      return pages;
    },
    async localize(entry) {
      const save = async <T extends { id: string; uri: string; remoteKey?: string }>(files: T[]): Promise<T[]> =>
        Promise.all(
          files.map(async (f) => {
            if (!f.remoteKey || !isRemote(f.uri)) return f;
            try {
              return { ...f, uri: await download(f.uri, fileId(f.remoteKey), extOf(f.remoteKey) || 'bin') };
            } catch {
              return f; // still viewable online; a later restore tries again
            }
          }),
        );
      return { ...entry, photos: await save(entry.photos), voices: await save(entry.voices) };
    },
  };
}
