import * as ImagePicker from 'expo-image-picker';
import { useLock } from '@/state/lockStore';
import { pickPhotos } from './photoPicker';

jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));
jest.mock('@/data/mediaStore', () => ({ persistMedia: (_src: string, id: string, ext: string) => `file:///doc/media/${id}.${ext}` }));
let mockN = 0;
jest.mock('@/lib/id', () => ({ newId: () => `id-${++mockN}` }));

const ip = ImagePicker as jest.Mocked<typeof ImagePicker>;
beforeEach(() => { jest.clearAllMocks(); mockN = 0; useLock.setState({ suspended: 0 }); });

it('returns the picked photos with persisted uris', async () => {
  ip.launchImageLibraryAsync.mockResolvedValue({ canceled: false, assets: [{ uri: 'file:///cache/a.png' }, { uri: 'file:///cache/b.jpeg' }] } as never);
  const r = await pickPhotos('library');
  expect(r).toEqual({ ok: true, photos: [{ id: 'id-1', uri: 'file:///doc/media/id-1.png' }, { id: 'id-2', uri: 'file:///doc/media/id-2.jpeg' }] });
});

it('treats a cancelled picker as a no-op', async () => {
  ip.launchImageLibraryAsync.mockResolvedValue({ canceled: true, assets: null } as never);
  expect(await pickPhotos('library')).toEqual({ ok: false, reason: 'cancelled' });
});

it('does not open the camera when permission is denied', async () => {
  ip.requestCameraPermissionsAsync.mockResolvedValue({ granted: false } as never);
  expect(await pickPhotos('camera')).toEqual({ ok: false, reason: 'denied' });
  expect(ip.launchCameraAsync).not.toHaveBeenCalled();
});

it('takes a photo when the camera is allowed', async () => {
  ip.requestCameraPermissionsAsync.mockResolvedValue({ granted: true } as never);
  ip.launchCameraAsync.mockResolvedValue({ canceled: false, assets: [{ uri: 'file:///cache/c' }] } as never);
  const r = await pickPhotos('camera');
  expect(r).toMatchObject({ ok: true, photos: [{ uri: 'file:///doc/media/id-1.jpg' }] });
});

it('keeps the app from re-locking while the system picker is open', async () => {
  let during = -1;
  ip.launchImageLibraryAsync.mockImplementation((async () => { during = useLock.getState().suspended; return { canceled: true, assets: null }; }) as never);
  await pickPhotos('library');
  expect(during).toBe(1);
});

it('reports an unexpected picker error as cancelled instead of crashing', async () => {
  ip.launchImageLibraryAsync.mockRejectedValue(new Error('boom'));
  expect(await pickPhotos('library')).toEqual({ ok: false, reason: 'cancelled' });
});
