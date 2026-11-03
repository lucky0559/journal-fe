import { useEffect } from 'react';
import { AppState, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useNotifications } from '@/state/notificationsStore';
import { colors } from '@/theme/tokens';
import { body } from '@/theme/type';
import { Icon } from '@/ui/Icon';

const POLL_MS = 60_000;

/** The bell in the Today header: opens the notifications and shows how many are new. It looks for new ones when the app opens and every minute after. */
export function NotificationBell() {
  const router = useRouter();
  const unread = useNotifications((s) => s.unread);
  const refresh = useNotifications((s) => s.refresh);

  useEffect(() => {
    void refresh();
    const timer = setInterval(() => void refresh(), POLL_MS);
    const sub = AppState.addEventListener('change', (s) => { if (s === 'active') void refresh(); });
    return () => { clearInterval(timer); sub.remove(); };
  }, [refresh]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={unread ? `Notifications, ${unread} new` : 'Notifications'}
      onPress={() => router.push('/notifications')}
      style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
    >
      <Icon name="bell" size={22} />
      {unread > 0 ? (
        <View style={{ position: 'absolute', top: 5, right: 3, minWidth: 18, height: 18, paddingHorizontal: 4, borderRadius: 9, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={[body(11, 'bold'), { color: colors.bg }]}>{unread > 9 ? '9+' : unread}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}
