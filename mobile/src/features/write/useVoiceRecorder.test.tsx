import { act, renderHook } from '@testing-library/react-native';
import { useLock } from '@/state/lockStore';
import { useVoiceRecorder } from './useVoiceRecorder';

const mockRecorder = { prepareToRecordAsync: jest.fn(async () => {}), record: jest.fn(), stop: jest.fn(async () => {}), uri: 'file:///cache/rec.m4a' };
const mockPermission = jest.fn();
const mockDelete = jest.fn();

jest.mock('expo-audio', () => ({
  useAudioRecorder: () => mockRecorder,
  RecordingPresets: { HIGH_QUALITY: {} },
  AudioModule: { requestRecordingPermissionsAsync: (...a: unknown[]) => mockPermission(...a) },
  setAudioModeAsync: jest.fn(async () => {}),
}));
jest.mock('@/data/mediaStore', () => ({ persistMedia: (_s: string, id: string, ext: string) => `file:///doc/media/${id}.${ext}`, deleteMedia: (u: string) => mockDelete(u) }));
jest.mock('@/lib/id', () => ({ newId: () => 'v-1' }));

beforeEach(() => { jest.clearAllMocks(); mockPermission.mockResolvedValue({ granted: true }); useLock.setState({ suspended: 0 }); });

it('refuses to start without microphone permission', async () => {
  mockPermission.mockResolvedValue({ granted: false });
  const { result } = renderHook(() => useVoiceRecorder());
  let r;
  await act(async () => { r = await result.current.start(); });
  expect(r).toBe('denied');
  expect(result.current.recording).toBe(false);
  expect(mockRecorder.record).not.toHaveBeenCalled();
});

it('reports an error instead of crashing when the recorder cannot start', async () => {
  mockRecorder.prepareToRecordAsync.mockRejectedValueOnce(new Error('busy'));
  const { result } = renderHook(() => useVoiceRecorder());
  let r;
  await act(async () => { r = await result.current.start(); });
  expect(r).toBe('error');
  expect(result.current.recording).toBe(false);
});

it('records, counts seconds and returns a persisted voice note on commit', async () => {
  const { result } = renderHook(() => useVoiceRecorder());
  await act(async () => { await result.current.start(); });
  expect(result.current.recording).toBe(true);
  await act(async () => { jest.advanceTimersByTime(7000); });
  expect(result.current.seconds).toBe(7);
  let voice;
  await act(async () => { voice = await result.current.stop(true); });
  expect(voice).toEqual({ id: 'v-1', uri: 'file:///doc/media/v-1.m4a', seconds: 7 });
  expect(result.current.recording).toBe(false);
});

it('counts a recording shorter than a second as 1s', async () => {
  const { result } = renderHook(() => useVoiceRecorder());
  await act(async () => { await result.current.start(); });
  let voice;
  await act(async () => { voice = await result.current.stop(true); });
  expect(voice).toMatchObject({ seconds: 1 });
});

it('discards the file when stopped without committing', async () => {
  const { result } = renderHook(() => useVoiceRecorder());
  await act(async () => { await result.current.start(); });
  let voice;
  await act(async () => { voice = await result.current.stop(false); });
  expect(voice).toBeNull();
  expect(mockDelete).toHaveBeenCalledWith('file:///cache/rec.m4a');
});

it('stop() when nothing is recording is a harmless no-op', async () => {
  const { result } = renderHook(() => useVoiceRecorder());
  let voice;
  await act(async () => { voice = await result.current.stop(true); });
  expect(voice).toBeNull();
  expect(mockRecorder.stop).not.toHaveBeenCalled();
});
