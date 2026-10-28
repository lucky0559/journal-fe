import { Directory, File, Paths, UploadType } from 'expo-file-system';

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

/**
 * Sends a file on the phone to a signed upload address as a multipart form (the provider's fields first, then the file)
 * and returns the HTTP status. The file is streamed from disk by the native side.
 */
export async function uploadFile(uri: string, url: string, fields: Record<string, string>, fieldName: string, mimeType: string): Promise<number> {
  const res = await new File(uri).upload(url, { httpMethod: 'POST', uploadType: UploadType.MULTIPART, fieldName, mimeType, parameters: fields });
  return res.status;
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
