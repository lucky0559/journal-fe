import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useTimelineUi } from '@/state/timelineStore';
import { TimelineScreen } from './TimelineScreen';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }), usePathname: () => '/timeline' }));
jest.mock('@/state', () => {
  const { create } = require('zustand');
  const { sampleEntries } = require('../../../test/sampleEntries');
  return { useEntries: create(() => ({ entries: sampleEntries('2026-10-08') })) };
});

const wrap = () =>
  render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 360, height: 800 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <TimelineScreen />
    </SafeAreaProvider>,
  );

beforeEach(() => {
  jest.clearAllMocks();
  jest.setSystemTime(new Date(2026, 9, 8, 21, 41));
  useTimelineUi.setState({ mode: 'cal', year: 2026, month: 9, selDay: '2026-10-08' });
});

describe('calendar', () => {
  it('shows the month, a Monday-first header and the empty state for a day without pages', () => {
    wrap();
    expect(screen.getByText('Your pages')).toBeTruthy();
    expect(screen.getByText('October 2026')).toBeTruthy();
    expect(screen.getAllByText('M').length).toBeGreaterThan(0);
    expect(screen.getByText('Today')).toBeTruthy();
    expect(screen.getByText('Nothing written this day.')).toBeTruthy();
  });

  it('selecting a day with a page lists it with its time, and opens it for editing', () => {
    wrap();
    fireEvent.press(screen.getByLabelText('Saturday, 3 October, 1 page'));
    expect(screen.getByText('Saturday, 3 October')).toBeTruthy();
    expect(screen.getByText('6:12 pm · Bright')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: /Found a bench/ }));
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/page/[id]', params: { id: 'sample-4' } }); // opens to be read, not edited
  });

  it('writes for a past day that has no page', () => {
    wrap();
    fireEvent.press(screen.getByLabelText('Sunday, 4 October'));
    fireEvent.press(screen.getByText('Write for this day'));
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/write', params: { date: '2026-10-04' } });
  });

  it('disables future days', () => {
    wrap();
    expect(screen.getByLabelText('Friday, 9 October')).toBeDisabled();
  });

  it('navigates months, wrapping the year', () => {
    useTimelineUi.setState({ year: 2026, month: 11, selDay: '2026-10-08' });
    wrap();
    expect(screen.getByText('December 2026')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Next month'));
    expect(screen.getByText('January 2027')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Previous month'));
    fireEvent.press(screen.getByLabelText('Previous month'));
    expect(screen.getByText('November 2026')).toBeTruthy();
  });

  it('hides "Write for this day" when the selected day is in the future', () => {
    useTimelineUi.setState({ selDay: '2026-10-20' });
    wrap();
    expect(screen.getByText('Nothing written this day.')).toBeTruthy();
    expect(screen.queryByText('Write for this day')).toBeNull();
  });
});

describe('list', () => {
  it('groups all pages under month headings', async () => {
    wrap();
    await act(async () => { fireEvent.press(screen.getByText('List')); });
    expect(screen.getByText('October 2026')).toBeTruthy();
    expect(screen.getByText('September 2026')).toBeTruthy();
    expect(screen.getByText('Wed, 7 Oct · Good')).toBeTruthy();
    expect(screen.getByText('Sun, 20 Sep · Bright')).toBeTruthy();
  });
});
