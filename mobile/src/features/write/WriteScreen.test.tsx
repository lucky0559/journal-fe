import { Alert } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { sampleEntries } from '../../../test/sampleEntries';
import { useToast } from '@/state/toastStore';
import { WriteScreen } from './WriteScreen';

const mockBack = jest.fn();
const mockReplace = jest.fn();
let mockParams: Record<string, string> = {};
const mockListeners: Record<string, (e: unknown) => void> = {};
const mockDispatch = jest.fn();
const mockSave = jest.fn(async (_e?: unknown) => {});

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack, replace: mockReplace }),
  useLocalSearchParams: () => mockParams,
  useNavigation: () => ({ addListener: (t: string, h: (e: unknown) => void) => { mockListeners[t] = h; return () => {}; }, dispatch: mockDispatch }),
}));
jest.mock('./useVoiceRecorder', () => ({
  useVoiceRecorder: () => ({ recording: false, seconds: 0, start: jest.fn(), stop: jest.fn(async () => null) }),
}));
jest.mock('@/services/photoPicker', () => ({ pickPhotos: jest.fn() }));
jest.mock('@/lib/id', () => ({ newId: () => 'new-1' }));
jest.mock('@/state', () => {
  const { create } = require('zustand');
  const { sampleEntries } = require('../../../test/sampleEntries');
  return { useEntries: create(() => ({ entries: sampleEntries('2026-10-08'), save: (e: unknown) => mockSave(e) })) };
});

const wrap = () =>
  render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 360, height: 800 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <WriteScreen />
    </SafeAreaProvider>,
  );
const saved = () => (mockSave.mock.calls[0] as unknown as [Record<string, unknown>])[0];
const leave = () => {
  const e = { preventDefault: jest.fn(), data: { action: { type: 'GO_BACK' } } };
  mockListeners.beforeRemove(e);
  return e;
};

beforeEach(() => {
  jest.clearAllMocks();
  mockParams = {};
  useToast.setState({ message: '' });
  jest.setSystemTime(new Date(2026, 9, 8, 21, 41));
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});

describe('new page', () => {
  it('shows the date, time and placeholder', () => {
    wrap();
    expect(screen.getByText('Thu, 8 Oct · 9:41 pm')).toBeTruthy();
    expect(screen.getByPlaceholderText('Start anywhere. One word is enough.')).toBeTruthy();
  });

  it.each(['', '   \n  '])('refuses to save an empty page (%j)', async (text) => {
    wrap();
    fireEvent.changeText(screen.getByPlaceholderText('Start anywhere. One word is enough.'), text);
    await act(async () => { fireEvent.press(screen.getByText('Save')); });
    expect(mockSave).not.toHaveBeenCalled();
    expect(mockBack).not.toHaveBeenCalled();
    expect(useToast.getState().message).toBe('Add a word, a photo, anything');
  });

  it('saves a page that has only a sticker', async () => {
    wrap();
    fireEvent.press(screen.getByText('Sticker'));
    expect(screen.getByText('Add a sticker')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Add calm sticker' }));
    expect(screen.getByRole('button', { name: 'Remove calm sticker' })).toBeTruthy();
    await act(async () => { fireEvent.press(screen.getByText('Save')); });
    expect(saved()).toMatchObject({ id: 'new-1', stickers: ['calm'], text: '', vis: 'private', date: '2026-10-08', time: '9:41 pm' });
    expect(useToast.getState().message).toBe('Saved to today’s page');
    expect(mockReplace).toHaveBeenCalledWith({ pathname: '/page/[id]', params: { id: 'new-1' } }); // opens to be read
    expect(mockBack).not.toHaveBeenCalled();
  });

  it('removes a sticker when tapped', () => {
    wrap();
    fireEvent.press(screen.getByText('Sticker'));
    fireEvent.press(screen.getByRole('button', { name: 'Add cozy sticker' }));
    fireEvent.press(screen.getByRole('button', { name: 'Remove cozy sticker' }));
    expect(screen.queryByRole('button', { name: 'Remove cozy sticker' })).toBeNull();
  });

  it('saves words with the chosen audience and says so', async () => {
    wrap();
    fireEvent.changeText(screen.getByPlaceholderText('Start anywhere. One word is enough.'), 'hello');
    fireEvent.press(screen.getByText('Only me'));
    expect(screen.getByText('Who can read this page?')).toBeTruthy();
    fireEvent.press(screen.getByText('Friends'));
    await act(async () => { fireEvent.press(screen.getByText('Save')); });
    expect(saved()).toMatchObject({ text: 'hello', vis: 'friends' });
    expect(useToast.getState().message).toBe('Saved to today’s page · shared with friends');
  });

  it('warns immediately when Public is chosen', () => {
    wrap();
    fireEvent.press(screen.getByText('Only me'));
    fireEvent.press(screen.getByText('Public'));
    expect(useToast.getState().message).toBe('This page will be public once saved');
    expect(screen.getByText('Public')).toBeTruthy();
  });

  it('starts from a prompt that can be removed', () => {
    mockParams = { prompt: 'Who did you feel close to today?' };
    wrap();
    expect(screen.getByText('Who did you feel close to today?')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Remove prompt'));
    expect(screen.queryByText('Who did you feel close to today?')).toBeNull();
  });

  it('writes for a back-dated day', async () => {
    mockParams = { date: '2026-10-03' };
    wrap();
    expect(screen.getByText('Sat, 3 Oct · 9:41 pm')).toBeTruthy();
    fireEvent.changeText(screen.getByPlaceholderText('Start anywhere. One word is enough.'), 'late entry');
    await act(async () => { fireEvent.press(screen.getByText('Save')); });
    expect(saved()).toMatchObject({ date: '2026-10-03' });
    expect(useToast.getState().message).toBe('Saved');
  });
});

describe('editing an existing page', () => {
  it('loads it and keeps its id, time and creation stamp on save', async () => {
    mockParams = { entryId: 'sample-1' };
    wrap();
    expect(screen.getByDisplayValue(/Made pasta with Jun/)).toBeTruthy();
    expect(screen.getByText('Wed, 7 Oct · 10:02 pm')).toBeTruthy();
    fireEvent.changeText(screen.getByDisplayValue(/Made pasta with Jun/), 'Edited');
    await act(async () => { fireEvent.press(screen.getByText('Save')); });
    const original = sampleEntries('2026-10-08')[0];
    expect(saved()).toMatchObject({ id: 'sample-1', time: '10:02 pm', createdAt: original.createdAt, text: 'Edited', vis: 'friends' });
    expect(useToast.getState().message).toBe('Saved · shared with friends');
    expect(mockBack).toHaveBeenCalled(); // back to the page being read
    expect(mockReplace).not.toHaveBeenCalled();
  });
});

describe('leaving without saving', () => {
  it('lets a clean page go without asking', () => {
    wrap();
    expect(leave().preventDefault).not.toHaveBeenCalled();
    expect(Alert.alert).not.toHaveBeenCalled();
  });

  it('asks before throwing away words', () => {
    wrap();
    fireEvent.changeText(screen.getByPlaceholderText('Start anywhere. One word is enough.'), 'something I meant');
    const e = leave();
    expect(e.preventDefault).toHaveBeenCalled();
    expect(Alert.alert).toHaveBeenCalledWith('Discard this page?', 'Your words and attachments won’t be saved.', expect.any(Array));
    const buttons = (Alert.alert as jest.Mock).mock.calls[0][2] as { text: string; onPress?: () => void }[];
    expect(buttons.map((b) => b.text)).toEqual(['Keep writing', 'Discard']);
    buttons[1].onPress?.();
    expect(mockDispatch).toHaveBeenCalledWith(e.data.action);
  });

  it('does not ask again after a successful save', async () => {
    wrap();
    fireEvent.changeText(screen.getByPlaceholderText('Start anywhere. One word is enough.'), 'saved words');
    await act(async () => { fireEvent.press(screen.getByText('Save')); });
    expect(leave().preventDefault).not.toHaveBeenCalled();
  });

  it('close button leaves a clean page straight away', () => {
    wrap();
    fireEvent.press(screen.getByLabelText('Close'));
    expect(mockBack).toHaveBeenCalled();
  });
});
