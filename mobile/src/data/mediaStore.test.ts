/** @jest-environment node */
const mockCreate = jest.fn();
const mockCopy = jest.fn();
const mockDelete = jest.fn();
const mockDownload = jest.fn();
const mockUpload = jest.fn();
let mockDirExists = false;
let mockFileExists = true;

jest.mock('expo-file-system', () => ({
  Paths: { document: 'file:///doc' },
  UploadType: { BINARY_CONTENT: 0, MULTIPART: 1 },
  Directory: class { uri: string; constructor(...p: string[]) { this.uri = p.join('/'); } get exists() { return mockDirExists; } create = mockCreate; },
  File: class {
    uri: string;
    constructor(...p: (string | { uri: string })[]) { this.uri = p.map((x) => (typeof x === 'string' ? x : x.uri)).join('/'); }
    get exists() { return mockFileExists; }
    copy = mockCopy;
    delete = mockDelete;
    upload(url: string, opts?: unknown) { return mockUpload(this.uri, url, opts); }
    static downloadFileAsync(url: string, dest: { uri: string }, opts?: unknown) { return mockDownload(url, dest, opts); }
  },
}));

import { deleteMedia, downloadMedia, persistMedia, uploadFile } from './mediaStore';

beforeEach(() => { jest.clearAllMocks(); mockDirExists = false; mockFileExists = true; });

it('creates the media folder once and copies the file into it', () => {
  const uri = persistMedia('file:///cache/pick.jpg', 'abc', 'jpg');
  expect(mockCreate).toHaveBeenCalledWith({ intermediates: true });
  expect(mockCopy).toHaveBeenCalledTimes(1);
  expect(uri).toBe('file:///doc/media/abc.jpg');
  mockDirExists = true;
  persistMedia('file:///cache/pick2.jpg', 'def', 'jpg');
  expect(mockCreate).toHaveBeenCalledTimes(1);
});

it('downloads a restored file into the media folder under the name we choose', async () => {
  mockDownload.mockImplementation(async (_url: string, dest: { uri: string }) => dest);
  const uri = await downloadMedia('https://res.example/img', 'abc', 'jpg');
  expect(mockCreate).toHaveBeenCalledWith({ intermediates: true });
  expect(mockDownload).toHaveBeenCalledWith('https://res.example/img', expect.objectContaining({ uri: 'file:///doc/media/abc.jpg' }), { idempotent: true });
  expect(uri).toBe('file:///doc/media/abc.jpg');
});

it('uploads a file as a multipart form with the provider’s fields and returns the status', async () => {
  mockUpload.mockResolvedValueOnce({ status: 200, body: '{}', headers: {} });
  const status = await uploadFile('file:///doc/media/a.jpeg', 'https://api.example/upload', { signature: 'sig', public_id: 'u/1' }, 'file', 'image/jpeg');
  expect(status).toBe(200);
  expect(mockUpload).toHaveBeenCalledWith('file:///doc/media/a.jpeg', 'https://api.example/upload', {
    httpMethod: 'POST', uploadType: 1, fieldName: 'file', mimeType: 'image/jpeg', parameters: { signature: 'sig', public_id: 'u/1' },
  });
});

it('lets a failed download reject so the caller can fall back to the remote link', async () => {
  mockDownload.mockRejectedValueOnce(new Error('UnableToDownload'));
  await expect(downloadMedia('https://res.example/img', 'abc', 'jpg')).rejects.toThrow('UnableToDownload');
});

it('deletes a file that exists and ignores one that does not', () => {
  deleteMedia('file:///doc/media/abc.jpg');
  expect(mockDelete).toHaveBeenCalledTimes(1);
  mockFileExists = false;
  deleteMedia('file:///doc/media/gone.jpg');
  expect(mockDelete).toHaveBeenCalledTimes(1);
});

it('never throws, and ignores empty uris (placeholder media)', () => {
  mockDelete.mockImplementationOnce(() => { throw new Error('io'); });
  expect(() => deleteMedia('file:///doc/media/abc.jpg')).not.toThrow();
  deleteMedia('');
  expect(mockDelete).toHaveBeenCalledTimes(1);
});
