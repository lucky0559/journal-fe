import * as ImagePicker from 'expo-image-picker';
import { persistMedia } from '@/data/mediaStore';
import type { Photo } from '@/domain/types';
import { newId } from '@/lib/id';
import { useLock } from '@/state/lockStore';

export type PickResult = { ok: true; photos: Photo[] } | { ok: false; reason: 'denied' | 'cancelled' };

const extOf = (uri: string) => /\.(\w{2,5})(?:\?|$)/.exec(uri)?.[1]?.toLowerCase() ?? 'jpg';

export function pickPhotos(source: 'library' | 'camera'): Promise<PickResult> {
  return useLock.getState().withoutRelock(async (): Promise<PickResult> => {
    try {
      let result: ImagePicker.ImagePickerResult;
      if (source === 'camera') {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) return { ok: false, reason: 'denied' };
        result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, quality: 0.8 });
      }
      if (result.canceled || !result.assets?.length) return { ok: false, reason: 'cancelled' };
      const photos = result.assets.map((a) => {
        const id = newId();
        return { id, uri: persistMedia(a.uri, id, extOf(a.uri)) };
      });
      return { ok: true, photos };
    } catch {
      return { ok: false, reason: 'cancelled' };
    }
  });
}
