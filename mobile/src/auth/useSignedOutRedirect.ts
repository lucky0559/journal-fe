import { useEffect } from 'react';
import { usePathname, useRouter } from 'expo-router';
import { useAuth } from '@/auth';

/** If the session ends while the app is open (expired token, deleted account), go back to login. */
export function useSignedOutRedirect(): void {
  const router = useRouter();
  const pathname = usePathname();
  const status = useAuth((s) => s.status);
  useEffect(() => {
    if (status === 'signedOut' && pathname !== '/login') router.replace('/login');
  }, [status, pathname, router]);
}
