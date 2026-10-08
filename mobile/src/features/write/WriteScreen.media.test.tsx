import { Alert } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useToast } from '@/state/toastStore';
import { WriteScreen } from './WriteScreen';

const mockBack = jest.fn();
const mockListeners: Record<string, (e: unknown) => void> = {};
const mockSave = jest.fn(async (_e?: unknown) => {});
const mockStart = jest.fn();
const mockStop = jest.fn();
let mockRecording = false;
const mockPick = jest.fn();
const mockDelete = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack }),
  useLocalSearchParams: () => ({}),
  useNavigation: () => ({ addListener: (t: string, h: (e: unknown) => void) => { mockListeners[t] = h; return () => {}; }, dispatch: jest.fn() }),
}));
jest.mock('@/lib/id', () => ({ newId: () => 'new-1' }));
jest.mock('@/state', () => {
  const { create } = require('zustand');
  return { useEntries: create(() => ({ entries: [], save: (e: unknown) => mockSave(e) })) };
});
jest.mock('./useVoiceRecorder', () => ({
  useVoiceRecorder: () => ({ recording: mockRecording, seconds: 7, start: mockStart, stop: mockStop }),
}));
jest.mock('@/services/photoPicker', () => ({ pickPhotos: (...a: unknown[]) => mockPick(...a) }));
jest.mock('expo-audio', () => ({
  useAudioPlayer: () => ({ play: jest.fn(), pause: jest.fn(), seekTo: jest.fn() }),
  useAudioPlayerStatus: () => ({ playing: false, didJustFinish: false, currentTime: 0, duration: 0 }),
}));
jest.mock('@/data/mediaStore', () => ({ deleteMedia: (u: string) => mockDelete(u), persistMedia: jest.fn() }));

const wrap = () =>
  render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 360, height: 800 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <WriteScreen />
    </SafeAreaProvider>,
  );

beforeEach(() => {
  jest.clearAllMocks();
  mockRecording = false;
  useToast.setState({ message: '' });
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});

it('adds picked photos and shows them as removable tiles', async () => {
  mockPick.mockResolvedValue({ ok: true, photos: [{ id: 'p1', uri: 'file:///doc/media/p1.jpg' }] });
  wrap();
  fireEvent.press(screen.getByLabelText('Photo'));
  expect(screen.getByText('Add a photo')).toBeTruthy();
  await act(async () => { fireEvent.press(screen.getByText('Choose from gallery')); });
  expect(mockPick).toHaveBeenCalledWith('library');
  expect(screen.getAllByLabelText('Remove photo')).toHaveLength(1);
  fireEvent.press(screen.getByLabelText('Remove photo'));
  expect(screen.queryByLabelText('Remove photo')).toBeNull();
});

it('does nothing when the picker is cancelled and explains a denied camera', async () => {
  wrap();
  mockPick.mockResolvedValue({ ok: false, reason: 'cancelled' });
  fireEvent.press(screen.getByLabelText('Photo'));
  await act(async () => { fireEvent.press(screen.getByText('Choose from gallery')); });
  expect(screen.queryByLabelText('Remove photo')).toBeNull();
  expect(useToast.getState().message).toBe('');
  mockPick.mockResolvedValue({ ok: false, reason: 'denied' });
  fireEvent.press(screen.getByLabelText('Photo'));
  await act(async () => { fireEvent.press(screen.getByText('Take a photo')); });
  expect(useToast.getState().message).toBe('Camera permission is off');
});

it('explains a denied microphone and an engine error', async () => {
  wrap();
  mockStart.mockResolvedValue('denied');
  await act(async () => { fireEvent.press(screen.getByLabelText('Voice')); });
  expect(useToast.getState().message).toBe('Microphone permission is off');
  mockStart.mockResolvedValue('error');
  await act(async () => { fireEvent.press(screen.getByLabelText('Voice')); });
  expect(useToast.getState().message).toBe('Couldn’t start recording');
});

it('shows the banner while recording and adds the note when Done is pressed', async () => {
  mockRecording = true;
  mockStop.mockResolvedValue({ id: 'v1', uri: 'file:///doc/media/v1.m4a', seconds: 7 });
  wrap();
  expect(screen.getByText('Listening… 0:07')).toBeTruthy();
  await act(async () => { fireEvent.press(screen.getByText('Done')); });
  expect(mockStop).toHaveBeenCalledWith(true);
  expect(screen.getByText('0:07')).toBeTruthy();
});

it('saving while still recording keeps the recording', async () => {
  mockRecording = true;
  mockStop.mockResolvedValue({ id: 'v1', uri: 'file:///doc/media/v1.m4a', seconds: 7 });
  wrap();
  await act(async () => { fireEvent.press(screen.getByText('Save')); });
  expect(mockStop).toHaveBeenCalledWith(true);
  expect(mockSave).toHaveBeenCalledWith(expect.objectContaining({ voices: [{ id: 'v1', uri: 'file:///doc/media/v1.m4a', seconds: 7 }] }));
});

it('discarding while recording stops without keeping it, and deletes photos added this session', async () => {
  mockPick.mockResolvedValue({ ok: true, photos: [{ id: 'p1', uri: 'file:///doc/media/p1.jpg' }] });
  wrap();
  fireEvent.press(screen.getByLabelText('Photo'));
  await act(async () => { fireEvent.press(screen.getByText('Choose from gallery')); });
  mockRecording = true;
  const e = { preventDefault: jest.fn(), data: { action: {} } };
  act(() => mockListeners.beforeRemove(e));
  expect(e.preventDefault).toHaveBeenCalled();
  const buttons = (Alert.alert as jest.Mock).mock.calls[0][2] as { onPress?: () => void }[];
  act(() => buttons[1].onPress?.());
  expect(mockStop).toHaveBeenCalledWith(false);
  expect(mockDelete).toHaveBeenCalledWith('file:///doc/media/p1.jpg');
});
