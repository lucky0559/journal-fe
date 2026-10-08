import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useSettings } from '@/state';
import { useLock } from '@/state/lockStore';

export function useRelockOnBackground(): void {
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') return;
      const { suspended, lock } = useLock.getState();
      if (useSettings.getState().settings.lockOn && suspended === 0) lock();
    });
    return () => sub.remove();
  }, []);
}
