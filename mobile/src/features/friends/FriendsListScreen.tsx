import { useCallback, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import type { ApiUser } from '@/api/types';
import { social } from '@/social';
import { avatarColor, initialOf } from '@/social/postView';
import { radii, ramp } from '@/theme/tokens';
import { body, heading } from '@/theme/type';
import { Avatar } from '@/ui/Avatar';
import { Button } from '@/ui/Button';
import { EmptyNote } from '@/ui/EmptyNote';
import { Loading } from '@/ui/Loading';
import { Icon } from '@/ui/Icon';
import { Screen } from '@/ui/Screen';

type Load = { status: 'loading' } | { status: 'error' } | { status: 'ready'; friends: ApiUser[] };

export function FriendsListScreen() {
  const router = useRouter();
  const [load, setLoad] = useState<Load>({ status: 'loading' });
  const loaded = useRef(false);

  const fetchFriends = useCallback(async () => {
    try {
      setLoad({ status: 'ready', friends: await social.friends() });
      loaded.current = true;
    } catch {
      // keep what is already on screen when a refresh fails
      if (!loaded.current) setLoad({ status: 'error' });
    }
  }, []);

  // Reload on every return, since a friend may have been removed from their profile.
  useFocusEffect(useCallback(() => { void fetchFriends(); }, [fetchFriends]));

  const retry = () => {
    setLoad({ status: 'loading' });
    void fetchFriends();
  };
  const openProfile = (id: string) => router.push({ pathname: '/friends/[id]', params: { id } });

  return (
    <Screen topPad={6} bottomPad={30} gap={18}>
      <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={{ width: 44, height: 44, marginLeft: -10, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="arrow-left" size={22} />
      </Pressable>
      <Text style={heading(32)}>Your friends</Text>

      {load.status === 'loading' ? <Loading label="Loading your friends" /> : null}
      {load.status === 'error' ? (
        <View style={{ gap: 10, alignItems: 'flex-start' }}>
          <Text style={body(15)}>Couldn’t load your friends.</Text>
          <Button label="Try again" variant="outline" height={44} onPress={retry} />
        </View>
      ) : null}
      {load.status === 'ready' && load.friends.length === 0 ? (
        <EmptyNote text="No friends yet. Use “Add a friend” with their profile link." />
      ) : null}
      {load.status === 'ready' && load.friends.length > 0 ? (
        <>
          <Text style={[body(14), { color: ramp.neutral[700] }]}>{load.friends.length === 1 ? '1 friend' : `${load.friends.length} friends`}</Text>
          <View style={{ gap: 10 }}>
            {load.friends.map((u) => (
              <Pressable
                key={u.id}
                accessibilityRole="button"
                accessibilityLabel={`${u.name}, profile`}
                onPress={() => openProfile(u.id)}
                style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: pressed ? ramp.neutral[200] : ramp.neutral[100], borderRadius: radii.card, padding: 12 })}
              >
                <Avatar initial={initialOf(u.name)} color={avatarColor(u.id)} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={body(15, 'bold')}>{u.name}</Text>
                  {u.bio ? <Text numberOfLines={1} style={[body(13), { color: ramp.neutral[700] }]}>{u.bio}</Text> : null}
                </View>
                <Icon name="chevron-right" size={18} color={ramp.neutral[500]} />
              </Pressable>
            ))}
          </View>
        </>
      ) : null}
    </Screen>
  );
}
