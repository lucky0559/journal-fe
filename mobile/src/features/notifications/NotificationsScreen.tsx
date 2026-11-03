import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ApiNotification } from '@/api/types';
import { social } from '@/social';
import { avatarColor, initialOf } from '@/social/postView';
import { useNotifications } from '@/state/notificationsStore';
import { colors, radii, ramp, shadows } from '@/theme/tokens';
import { body, heading } from '@/theme/type';
import { Avatar } from '@/ui/Avatar';
import { Button } from '@/ui/Button';
import { EmptyNote } from '@/ui/EmptyNote';
import { Icon } from '@/ui/Icon';
import { notificationText, timeAgo } from './notificationView';

type Load = { status: 'loading' } | { status: 'error' } | { status: 'ready'; items: ApiNotification[] };

/** Who sent a friend request, accepted yours or reacted to a page. New ones are marked until you leave. */
export function NotificationsScreen() {
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();
  const [state, setState] = useState<Load>({ status: 'loading' });

  const load = useCallback(async () => {
    setState({ status: 'loading' });
    try {
      const { items } = await social.notifications();
      setState({ status: 'ready', items });
      // Showing them counts as seeing them; the rows keep their "new" mark until you leave.
      if (items.some((n) => !n.read)) {
        await social.markNotificationsRead();
        useNotifications.getState().clear();
      }
    } catch {
      setState((s) => (s.status === 'ready' ? s : { status: 'error' }));
    }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)'));

  const open = (n: ApiNotification) => {
    if (n.kind === 'reaction' && n.postId) router.push({ pathname: '/page/[id]', params: { id: n.postId } });
    else router.push({ pathname: '/friends/[id]', params: { id: n.actor.id } });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: top }}>
      <View style={{ height: 60, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14 }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={close} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="arrow-left" size={22} />
        </Pressable>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: bottom + 24, gap: 12 }}>
        <Text style={heading(32)}>Notifications</Text>

        {state.status === 'loading' ? <Text style={[body(15), { color: ramp.neutral[700] }]}>Looking for news…</Text> : null}
        {state.status === 'error' ? (
          <View style={{ gap: 10, alignItems: 'flex-start' }}>
            <Text style={body(15)}>Couldn’t load your notifications.</Text>
            <Button label="Try again" variant="outline" height={44} onPress={() => void load()} />
          </View>
        ) : null}
        {state.status === 'ready' && state.items.length === 0 ? <EmptyNote text="Nothing new yet. Friend requests and reactions will show up here." /> : null}
        {state.status === 'ready' ? state.items.map((n) => <Row key={n.id} n={n} onPress={() => open(n)} />) : null}
      </ScrollView>
    </View>
  );
}

function Row({ n, onPress }: { n: ApiNotification; onPress: () => void }) {
  const text = notificationText(n);
  const when = timeAgo(n.createdAt, Date.now());
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${n.read ? '' : 'New. '}${text}, ${when}`}
      onPress={onPress}
      style={({ pressed }) => [
        { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: radii.card, backgroundColor: pressed ? ramp.accent[100] : ramp.neutral[100] },
        shadows.sm,
      ]}
    >
      <Avatar initial={initialOf(n.actor.name)} color={avatarColor(n.actor.id)} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={body(15, n.read ? 'body' : 'semi', 1.35)}>{text}</Text>
        <Text style={[body(12), { color: ramp.neutral[700] }]}>{when}</Text>
      </View>
      {n.read ? null : <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent }} />}
    </Pressable>
  );
}
