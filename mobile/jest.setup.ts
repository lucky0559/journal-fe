// Native modules are mocked per test file; this file only holds global test setup.
jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate'] });

import 'react-native-gesture-handler/jestSetup';

jest.mock('react-native-reanimated', () => require('./test/reanimatedStub'));

// GestureDetector reaches into Reanimated internals; tests only need it to render its child.
jest.mock('react-native-gesture-handler', () => {
  const actual = jest.requireActual('react-native-gesture-handler');
  const { View } = require('react-native');
  return { ...actual, GestureDetector: ({ children }: { children: unknown }) => children, GestureHandlerRootView: View };
});
