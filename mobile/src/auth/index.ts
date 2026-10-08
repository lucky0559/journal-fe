import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { pinKeyValueStore } from '@/data/pinVaultInstance';
import { createAuthStore } from './authStore';
import { localAuthGateway } from './gateway';
import { createGoogleProvider, type GoogleSdk } from './googleProvider';
import { createSessionVault } from './sessionVault';

const sdk: GoogleSdk = {
  configure: (o) => GoogleSignin.configure(o),
  hasPlayServices: async () => {
    await GoogleSignin.hasPlayServices();
    return true;
  },
  signIn: () => GoogleSignin.signIn() as unknown as ReturnType<GoogleSdk['signIn']>,
  signOut: () => GoogleSignin.signOut(),
  statusCodes,
};

/** Web client ID from Google Cloud Console (the Android client is matched by package name + SHA-1). */
const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';

export const useAuth = createAuthStore({
  provider: createGoogleProvider(sdk, WEB_CLIENT_ID),
  gateway: localAuthGateway,
  vault: createSessionVault(pinKeyValueStore),
});
