import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/auth';
import { parseRadii } from '@/lib/blob';
import { colors, ramp } from '@/theme/tokens';
import { body, heading } from '@/theme/type';
import { Blob } from '@/ui/Blob';
import { Button } from '@/ui/Button';
import { ScreenFade } from '@/ui/ScreenFade';

const BLOB = parseRadii('58% 42% 38% 62% / 64% 46% 54% 36%');
const CIRCLE = parseRadii('50%');

export function LoginScreen() {
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();
  const status = useAuth((s) => s.status);
  const busy = useAuth((s) => s.busy);
  const error = useAuth((s) => s.error);
  const signIn = useAuth((s) => s.signIn);

  useEffect(() => {
    if (status === 'signedIn') router.replace('/');
  }, [status, router]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenFade style={{ paddingTop: top + 10, paddingHorizontal: 26, paddingBottom: bottom + 26, gap: 20 }}>
        <View style={{ height: 270, marginTop: 24 }}>
          <View style={{ position: 'absolute', left: 0, top: 30 }}><Blob radii={CIRCLE} size={190} color={ramp.accent[300]} /></View>
          <View style={{ position: 'absolute', right: 6, top: 0 }}><Blob radii={BLOB} size={150} color={ramp.accent2[300]} /></View>
          <View style={{ position: 'absolute', left: 150, top: 170 }}><Blob radii={CIRCLE} size={92} color={ramp.accent[500]} /></View>
        </View>
        <View style={{ flex: 1, gap: 12 }}>
          <Text style={heading(36, 1.08)}>Welcome to your journal.</Text>
          <Text style={[body(16, 'body', 1.5), { color: ramp.neutral[800] }]}>Sign in with Google to get started. Your journal is saved to your account, so it follows you to any phone. Only pages you share are seen by others.</Text>
          {error ? <Text accessibilityLiveRegion="polite" style={[body(15), { color: ramp.accent[700] }]}>{error}</Text> : null}
        </View>
        <Button label="Continue with Google" onPress={signIn} disabled={busy} />
      </ScreenFade>
    </View>
  );
}
