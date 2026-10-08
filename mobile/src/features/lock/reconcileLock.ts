import type { PinVault } from '@/data/pinVault';

/** An OS backup can restore the database but not the keystore; never lock the user out of a PIN that no longer exists. */
export async function reconcileLock(lockOn: boolean, vault: Pick<PinVault, 'has'>): Promise<boolean> {
  if (!lockOn) return false;
  try {
    return await vault.has();
  } catch {
    return true;
  }
}
