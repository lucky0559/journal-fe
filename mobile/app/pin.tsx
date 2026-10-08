import { useRouter, useLocalSearchParams } from 'expo-router';
import { pinVault } from '@/data/pinVaultInstance';
import { PinPad } from '@/features/lock/PinPad';
import { useSettings } from '@/state';
import { useToast } from '@/state/toastStore';

export default function PinRoute() {
  const router = useRouter();
  const { after } = useLocalSearchParams<{ after?: string }>();
  const settings = useSettings((s) => s.settings);
  const update = useSettings((s) => s.update);
  const show = useToast((s) => s.show);
  const target = after === 'me' ? '/(tabs)/me' : '/(tabs)';

  return (
    <PinPad
      mode="set"
      name={settings.name}
      onCancel={async () => {
        await update({ onboarded: true });
        router.replace(target);
      }}
      onSetComplete={async (pin) => {
        try {
          await pinVault.save(pin);
          await update({ lockOn: true, onboarded: true });
          show('App lock is on');
          router.replace(target);
        } catch {
          show('Couldn’t save your PIN. Try again.');
          router.replace('/pin');
        }
      }}
    />
  );
}
