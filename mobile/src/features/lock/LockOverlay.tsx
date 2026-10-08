import { useEffect, useState } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import { pinVault } from '@/data/pinVaultInstance';
import { biometricAvailable, promptBiometric } from '@/services/biometrics';
import { useSettings } from '@/state';
import { useLock } from '@/state/lockStore';
import { PinPad } from './PinPad';

export function LockOverlay() {
  const locked = useLock((s) => s.locked);
  const unlock = useLock((s) => s.unlock);
  const name = useSettings((s) => s.settings.name);
  const [bio, setBio] = useState<boolean | null>(null); // null = still checking; PinPad mounts after this resolves

  useEffect(() => {
    if (!locked) {
      setBio(null);
      return;
    }
    let alive = true;
    biometricAvailable().then((v) => alive && setBio(v));
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true); // Back must not reveal pages behind the lock
    return () => {
      alive = false;
      sub.remove();
    };
  }, [locked]);

  if (!locked || bio === null) return null;
  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 100 }]}>
      <PinPad mode="unlock" name={name} verify={pinVault.verify} onUnlocked={unlock} biometric={bio ? promptBiometric : undefined} />
    </View>
  );
}
