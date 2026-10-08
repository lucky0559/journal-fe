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

jest.mock('expo-audio', () => ({
  useAudioPlayer: () => ({ play: jest.fn(), pause: jest.fn(), seekTo: jest.fn() }),
  useAudioPlayerStatus: () => ({ playing: false, didJustFinish: false, currentTime: 0, duration: 0 }),
  useAudioRecorder: () => ({ prepareToRecordAsync: jest.fn(), record: jest.fn(), stop: jest.fn(), uri: null }),
  RecordingPresets: { HIGH_QUALITY: {} },
  AudioModule: { requestRecordingPermissionsAsync: jest.fn(async () => ({ granted: true })) },
  setAudioModeAsync: jest.fn(async () => {}),
}));

jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: { configure: jest.fn(), hasPlayServices: jest.fn(async () => true), signIn: jest.fn(), signOut: jest.fn(async () => null) },
  statusCodes: { SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED', PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE', IN_PROGRESS: 'IN_PROGRESS' },
}));
