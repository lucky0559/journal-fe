/** @jest-environment node */
const mockCreate = jest.fn();
const mockCopy = jest.fn();
const mockDelete = jest.fn();
let mockDirExists = false;
let mockFileExists = true;

jest.mock('expo-file-system', () => ({
  Paths: { document: 'file:///doc' },
  Directory: class { uri: string; constructor(...p: string[]) { this.uri = p.join('/'); } get exists() { return mockDirExists; } create = mockCreate; },
  File: class {
    uri: string;
    constructor(...p: (string | { uri: string })[]) { this.uri = p.map((x) => (typeof x === 'string' ? x : x.uri)).join('/'); }
    get exists() { return mockFileExists; }
    copy = mockCopy;
    delete = mockDelete;
  },
}));

import { deleteMedia, persistMedia } from './mediaStore';

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

it('deletes a file that exists and ignores one that does not', () => {
  deleteMedia('file:///doc/media/abc.jpg');
  expect(mockDelete).toHaveBeenCalledTimes(1);
  mockFileExists = false;
  deleteMedia('file:///doc/media/gone.jpg');
  expect(mockDelete).toHaveBeenCalledTimes(1);
});

it('never throws, and ignores empty uris (demo media)', () => {
  mockDelete.mockImplementationOnce(() => { throw new Error('io'); });
  expect(() => deleteMedia('file:///doc/media/abc.jpg')).not.toThrow();
  deleteMedia('');
  expect(mockDelete).toHaveBeenCalledTimes(1);
});
