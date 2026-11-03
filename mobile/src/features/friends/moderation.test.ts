import { Alert, type AlertButton } from 'react-native';
import { useToast } from '@/state/toastStore';
import { BLOCK_FAILED, openModerationMenu, REPORT_FAILED, REPORT_SENT } from './moderation';

const mockSocial = { reportPost: jest.fn(), reportUser: jest.fn(), block: jest.fn() };
jest.mock('@/social', () => ({ social: new Proxy({}, { get: (_t, k: string) => (...a: unknown[]) => (mockSocial as Record<string, (...x: unknown[]) => unknown>)[k](...a) }) }));

const person = { id: 'u1', name: 'Jun Park' };
let alert: jest.SpyInstance;
const buttons = (call: number): AlertButton[] => alert.mock.calls[call][2] as AlertButton[];
const press = async (call: number, text: string) => { await buttons(call).find((b) => b.text === text)!.onPress?.(); };
const flush = () => new Promise<void>((r) => setImmediate(r));

beforeEach(() => {
  jest.clearAllMocks();
  useToast.setState({ message: '' });
  mockSocial.reportPost.mockResolvedValue(undefined);
  mockSocial.reportUser.mockResolvedValue(undefined);
  mockSocial.block.mockResolvedValue(undefined);
  alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});
afterEach(() => alert.mockRestore());

it('offers Report, Block and Cancel', () => {
  openModerationMenu({ person });
  expect(alert.mock.calls[0][0]).toBe('Jun Park');
  expect(buttons(0).map((b) => b.text)).toEqual(['Report', 'Block', 'Cancel']);
});

it('reports a page with the reason chosen, and says thanks', async () => {
  openModerationMenu({ person, postId: 'p1' });
  await press(0, 'Report');
  expect(alert.mock.calls[1][0]).toBe('Report this page');
  expect(buttons(1).map((b) => b.text)).toEqual(['Spam or fake', 'Harassment or hate', 'Something else']);
  await press(1, 'Harassment or hate');
  await flush();
  expect(mockSocial.reportPost).toHaveBeenCalledWith('p1', 'harassment');
  expect(useToast.getState().message).toBe(REPORT_SENT);
});

it('reports the person when there is no page', async () => {
  openModerationMenu({ person });
  await press(0, 'Report');
  await press(1, 'Spam or fake');
  await flush();
  expect(mockSocial.reportUser).toHaveBeenCalledWith('u1', 'spam');
  expect(mockSocial.reportPost).not.toHaveBeenCalled();
});

it('says so when a report fails', async () => {
  mockSocial.reportUser.mockRejectedValue(new Error('offline'));
  openModerationMenu({ person });
  await press(0, 'Report');
  await press(1, 'Something else');
  await flush();
  expect(useToast.getState().message).toBe(REPORT_FAILED);
});

it('asks before blocking, then blocks and lets the screen know', async () => {
  const onBlocked = jest.fn();
  openModerationMenu({ person, onBlocked });
  await press(0, 'Block');
  expect(alert.mock.calls[1][0]).toBe('Block Jun Park?');
  expect(mockSocial.block).not.toHaveBeenCalled(); // not until confirmed
  await press(1, 'Block');
  await flush();
  expect(mockSocial.block).toHaveBeenCalledWith('u1');
  expect(onBlocked).toHaveBeenCalled();
  expect(useToast.getState().message).toBe('Jun Park is blocked');
});

it('does not drop the screen’s content when blocking fails', async () => {
  mockSocial.block.mockRejectedValue(new Error('offline'));
  const onBlocked = jest.fn();
  openModerationMenu({ person, onBlocked });
  await press(0, 'Block');
  await press(1, 'Block');
  await flush();
  expect(onBlocked).not.toHaveBeenCalled();
  expect(useToast.getState().message).toBe(BLOCK_FAILED);
});
