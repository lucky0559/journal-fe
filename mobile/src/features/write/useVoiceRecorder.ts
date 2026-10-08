import { useEffect, useRef, useState } from 'react';
import { AudioModule, RecordingPresets, setAudioModeAsync, useAudioRecorder } from 'expo-audio';
import { deleteMedia, persistMedia } from '@/data/mediaStore';
import type { Voice } from '@/domain/types';
import { newId } from '@/lib/id';
import { useLock } from '@/state/lockStore';

export function useVoiceRecorder() {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const secRef = useRef(0);
  const recRef = useRef(false);
  const timer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const start = (): Promise<'started' | 'denied' | 'error'> =>
    useLock.getState().withoutRelock(async () => {
      const perm = await AudioModule.requestRecordingPermissionsAsync();
      if (!perm.granted) return 'denied';
      try {
        await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
        await recorder.prepareToRecordAsync();
        recorder.record();
      } catch {
        return 'error';
      }
      secRef.current = 0;
      setSeconds(0);
      recRef.current = true;
      setRecording(true);
      timer.current = setInterval(() => { secRef.current += 1; setSeconds(secRef.current); }, 1000);
      return 'started';
    });

  const stop = async (commit: boolean): Promise<Voice | null> => {
    if (!recRef.current) return null;
    recRef.current = false;
    clearInterval(timer.current);
    setRecording(false);
    try {
      await recorder.stop();
    } catch {
      return null;
    }
    const uri = recorder.uri;
    if (!uri) return null;
    if (!commit) {
      deleteMedia(uri);
      return null;
    }
    const id = newId();
    return { id, uri: persistMedia(uri, id, 'm4a'), seconds: Math.max(1, secRef.current) };
  };

  useEffect(() => () => clearInterval(timer.current), []);
  return { recording, seconds, start, stop };
}
