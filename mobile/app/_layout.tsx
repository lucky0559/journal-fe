import 'react-native-gesture-handler';
import { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { bootstrapState } from '@/state';
import { useAppFonts } from '@/theme/fonts';
import { colors } from '@/theme/tokens';
import { body, heading } from '@/theme/type';
import { Button } from '@/ui/Button';
import { ToastHost } from '@/ui/Toast';
import { LockOverlay } from '@/features/lock/LockOverlay';
import { useRelockOnBackground } from '@/features/lock/useRelockOnBackground';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  useRelockOnBackground();
  const fontsReady = useAppFonts();
  const [state, setState] = useState<'loading' | 'ready' | 'failed'>('loading');

  const boot = useCallback(() => {
    setState('loading');
    bootstrapState().then(() => setState('ready'), () => setState('failed'));
  }, []);
  useEffect(boot, [boot]);

  useEffect(() => {
    if (fontsReady && state !== 'loading') SplashScreen.hideAsync().catch(() => {});
  }, [fontsReady, state]);

  if (!fontsReady || state === 'loading') return null;

  if (state === 'failed') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, padding: 30, justifyContent: 'center', gap: 16 }}>
        <Text style={heading(28)}>We couldn’t open your journal.</Text>
        <Text style={body(15)}>Your pages are safe on this phone. Try again in a moment.</Text>
        <Button label="Try again" onPress={boot} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg }, animation: 'fade' }} />
        <LockOverlay />
        <ToastHost />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
