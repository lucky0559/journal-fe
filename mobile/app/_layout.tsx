import 'react-native-gesture-handler';
import { useCallback, useEffect, useState } from 'react';
import { Appearance, Text, TextInput, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { bootstrapState, useSettings } from '@/state';
import { useAppFonts } from '@/theme/fonts';
import { applyTheme, colors, statusBarStyle } from '@/theme/tokens';
import { body, heading } from '@/theme/type';
import { Button } from '@/ui/Button';
import { ToastHost } from '@/ui/Toast';
import * as Notifications from 'expo-notifications';
import { useSyncPending } from '@/state/useSyncPending';
import { useSignedOutRedirect } from '@/auth/useSignedOutRedirect';
import { useRemindersSync } from '@/services/useRemindersSync';
import { LockOverlay } from '@/features/lock/LockOverlay';
import { useRelockOnBackground } from '@/features/lock/useRelockOnBackground';

SplashScreen.preventAutoHideAsync().catch(() => {});

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
});

// Keep the layout intact at large system font sizes without ignoring them.
const withFontCap = (C: unknown) => {
  const T = C as { defaultProps?: object };
  T.defaultProps = { ...T.defaultProps, maxFontSizeMultiplier: 1.3 };
};
withFontCap(Text);
withFontCap(TextInput);

export default function RootLayout() {
  useRelockOnBackground();
  useRemindersSync();
  useSignedOutRedirect();
  useSyncPending();
  const fontsReady = useAppFonts();
  const theme = useSettings((s) => s.settings.theme);
  // Swap the palette before anything below draws; `key={theme}` on the root view then rebuilds every screen with it.
  applyTheme(theme);
  useEffect(() => {
    Appearance.setColorScheme(theme); // so native dialogs and the keyboard match
    SystemUI.setBackgroundColorAsync(colors.bg).catch(() => {});
  }, [theme]);
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
    <GestureHandlerRootView key={theme} style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaProvider>
        <StatusBar style={statusBarStyle()} />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg }, animation: 'fade' }}>
          <Stack.Screen name="write" options={{ animation: 'slide_from_bottom' }} />
        </Stack>
        <LockOverlay />
        <ToastHost />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
