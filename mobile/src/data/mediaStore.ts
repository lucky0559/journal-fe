import { Directory, File, Paths } from 'expo-file-system';

const mediaDir = () => new Directory(Paths.document, 'media');

/** Copies a picked/recorded file into app storage (cache files can be purged) and returns its new uri. */
export function persistMedia(srcUri: string, id: string, ext: string): string {
  const dir = mediaDir();
  if (!dir.exists) dir.create({ intermediates: true });
  const dest = new File(dir, `${id}.${ext}`);
  new File(srcUri).copy(dest);
  return dest.uri;
}

/** Saves a file from the network (restored from the account) into app storage and returns its new uri. */
export async function downloadMedia(url: string, id: string, ext: string): Promise<string> {
  const dir = mediaDir();
  if (!dir.exists) dir.create({ intermediates: true });
  const file = await File.downloadFileAsync(url, new File(dir, `${id}.${ext}`), { idempotent: true });
  return file.uri;
}

export function deleteMedia(uri: string): void {
  if (!uri) return;
  try {
    const f = new File(uri);
    if (f.exists) f.delete();
  } catch {
    // Already gone or unreadable; nothing useful to do.
  }
}
