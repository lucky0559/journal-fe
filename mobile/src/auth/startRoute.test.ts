import { startRoute } from './startRoute';

it('waits while the session is still being restored', () => {
  expect(startRoute({ authStatus: 'unknown', onboarded: false })).toBe(null);
});
it('sends signed-out users to login, even if they finished onboarding before', () => {
  expect(startRoute({ authStatus: 'signedOut', onboarded: false })).toBe('/login');
  expect(startRoute({ authStatus: 'signedOut', onboarded: true })).toBe('/login');
});
it('sends signed-in users to onboarding or the app', () => {
  expect(startRoute({ authStatus: 'signedIn', onboarded: false })).toBe('/onboarding');
  expect(startRoute({ authStatus: 'signedIn', onboarded: true })).toBe('/(tabs)');
});
