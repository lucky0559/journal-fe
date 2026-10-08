import { Redirect } from 'expo-router';
import { useSettings } from '@/state';

export default function Start() {
  const onboarded = useSettings((s) => s.settings.onboarded);
  return <Redirect href={onboarded ? '/(tabs)' : '/onboarding'} />;
}
