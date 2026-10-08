import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { createPinVault } from './pinVault';

const hex = (b: Uint8Array) => [...b].map((x) => x.toString(16).padStart(2, '0')).join('');

export const pinVault = createPinVault({
  store: {
    get: (k) => SecureStore.getItemAsync(k),
    set: (k, v) => SecureStore.setItemAsync(k, v),
    del: (k) => SecureStore.deleteItemAsync(k),
  },
  digest: (s) => Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, s),
  randomSalt: async () => hex(await Crypto.getRandomBytesAsync(16)),
});
