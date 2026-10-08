import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BottomNav } from './BottomNav';

const routes = ['index', 'timeline', 'friends', 'me'].map((name) => ({ key: name, name }));
const titles: Record<string, string> = { index: 'Today', timeline: 'Timeline', friends: 'Friends', me: 'Me' };

function setup(index = 0) {
  const navigation = { emit: jest.fn(() => ({ defaultPrevented: false })), navigate: jest.fn() };
  const props = {
    state: { index, routes, key: 's', routeNames: routes.map((r) => r.name), type: 'tab', stale: false, history: [] },
    descriptors: Object.fromEntries(routes.map((r) => [r.key, { options: { title: titles[r.name] } }])),
    navigation,
    insets: { top: 0, bottom: 0, left: 0, right: 0 },
  } as unknown as React.ComponentProps<typeof BottomNav>;
  render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 360, height: 800 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <BottomNav {...props} />
    </SafeAreaProvider>,
  );
  return navigation;
}

it('shows the four destinations and marks the focused one', () => {
  setup(1);
  expect(screen.getAllByRole('tab')).toHaveLength(4);
  expect(screen.getByRole('tab', { name: 'Timeline' })).toBeSelected();
  expect(screen.getByRole('tab', { name: 'Today' })).not.toBeSelected();
});

it('navigates on press', () => {
  const nav = setup(0);
  fireEvent.press(screen.getByRole('tab', { name: 'Me' }));
  expect(nav.navigate).toHaveBeenCalledWith('me', undefined);
});
