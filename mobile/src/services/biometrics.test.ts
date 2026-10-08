import * as LocalAuthentication from 'expo-local-authentication';
import { biometricAvailable, promptBiometric } from './biometrics';

jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn(), isEnrolledAsync: jest.fn(), authenticateAsync: jest.fn(),
}));
const la = LocalAuthentication as jest.Mocked<typeof LocalAuthentication>;

it('is available only with hardware and an enrolled biometric', async () => {
  la.hasHardwareAsync.mockResolvedValue(true);
  la.isEnrolledAsync.mockResolvedValue(true);
  expect(await biometricAvailable()).toBe(true);
  la.isEnrolledAsync.mockResolvedValue(false);
  expect(await biometricAvailable()).toBe(false);
  la.hasHardwareAsync.mockResolvedValue(false);
  expect(await biometricAvailable()).toBe(false);
});

it('reports the prompt result and treats errors as a failure', async () => {
  la.authenticateAsync.mockResolvedValue({ success: true } as never);
  expect(await promptBiometric()).toBe(true);
  la.authenticateAsync.mockResolvedValue({ success: false, error: 'user_cancel' } as never);
  expect(await promptBiometric()).toBe(false);
  la.authenticateAsync.mockRejectedValue(new Error('boom'));
  expect(await promptBiometric()).toBe(false);
});
