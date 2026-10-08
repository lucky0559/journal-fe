import { Redirect } from 'expo-router';
import { useAuth } from '@/auth';
import { startRoute } from '@/auth/startRoute';
import { useSettings } from '@/state';

export default function Start() {
  const authStatus = useAuth((s) => s.status);
  const onboarded = useSettings((s) => s.settings.onboarded);
  const href = startRoute({ authStatus, onboarded });
  return href ? <Redirect href={href} /> : null;
}
