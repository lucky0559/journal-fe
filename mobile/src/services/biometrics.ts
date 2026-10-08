import * as LocalAuthentication from 'expo-local-authentication';

export async function biometricAvailable(): Promise<boolean> {
  try {
    return (await LocalAuthentication.hasHardwareAsync()) && (await LocalAuthentication.isEnrolledAsync());
  } catch {
    return false;
  }
}

export async function promptBiometric(): Promise<boolean> {
  try {
    const r = await LocalAuthentication.authenticateAsync({ promptMessage: 'Unlock your journal', cancelLabel: 'Use PIN', disableDeviceFallback: true });
    return r.success;
  } catch {
    return false;
  }
}
