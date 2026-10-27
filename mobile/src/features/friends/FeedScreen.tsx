import { useCallback, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { social } from '@/social';
import { usePagedPosts } from '@/social/usePagedPosts';
import { avatarColor, initialOf } from '@/social/postView';
import { useToast } from '@/state/toastStore';
import { colors, radii, ramp } from '@/theme/tokens';
import { body, heading } from '@/theme/type';
import { Avatar } from '@/ui/Avatar';
import { Button } from '@/ui/Button';
import { Screen } from '@/ui/Screen';
import { Segmented } from '@/ui/Segmented';
import { AddFriendSheet } from './AddFriendSheet';
import { PostCard } from './PostCard';
import { UPDATE_FAILED, useIncomingRequests } from './useIncomingRequests';

export function FeedScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<'friends' | 'public'>('friends');
  const [adding, setAdding] = useState(false);
  const feed = usePagedPosts({ key: tab, fetchPage: (before) => social.feed(tab, before), social });
  const requests = useIncomingRequests(social, () => void feed.refresh());
  const openProfile = (id: string) => router.push({ pathname: '/friends/[id]', params: { id } });

  // Come back to fresh data when returning to this tab (the first focus is already covered by the initial load).
  const firstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) { firstFocus.current = false; return; }
      void feed.refresh();
      void requests.reload();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [feed.refresh, requests.reload]),
  );

  const react = async (id: string, kind: 'hug' | 'same') => {
    if (!(await feed.toggleReaction(id, kind))) useToast.getState().show(UPDATE_FAILED);
  };

  return (
    <Screen gap={18} bottomPad={30}>
      <View style={{ gap: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <Text style={[heading(32), { flexShrink: 1 }]}>Others’ pages</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add a friend"
            onPress={() => setAdding(true)}
            style={({ pressed }) => ({ height: 44, paddingHorizontal: 16, borderRadius: radii.pill, borderWidth: 1.5, borderColor: colors.divider, justifyContent: 'center', backgroundColor: pressed ? ramp.neutral[200] : 'transparent' })}
          >
            <Text style={body(14, 'semi')}>Add a friend</Text>
          </Pressable>
        </View>
        <Segmented options={[{ key: 'friends', label: 'Friends' }, { key: 'public', label: 'Public' }]} value={tab} onChange={setTab} />
        <Text style={[body(13, 'body', 1.45), { color: ramp.neutral[700] }]}>
          {tab === 'friends' ? 'Pages your friends chose to share with you.' : 'Pages anyone has made public. Tap a name to see more.'}
        </Text>
      </View>

      {tab === 'friends' && requests.items.length ? (
        <View style={{ gap: 10 }}>
          <Text style={body(15, 'semi')}>Friend requests</Text>
          {requests.items.map((u) => (
            <View key={u.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: ramp.neutral[100], borderRadius: radii.card, padding: 12 }}>
              <Avatar initial={initialOf(u.name)} color={avatarColor(u.id)} onPress={() => openProfile(u.id)} />
              <Pressable accessibilityRole="button" accessibilityLabel={`${u.name}, profile`} onPress={() => openProfile(u.id)} style={{ flex: 1 }}>
                <Text style={body(15, 'bold')}>{u.name}</Text>
              </Pressable>
              <Button label="Accept" accessibilityLabel={`Accept ${u.givenName}`} height={44} fontSize={14} onPress={() => requests.accept(u)} />
              <Button label="Decline" variant="ghost" accessibilityLabel={`Decline ${u.givenName}`} height={44} onPress={() => requests.decline(u)} />
            </View>
          ))}
        </View>
      ) : null}

      {feed.status === 'loading' ? <Text style={[body(15), { color: ramp.neutral[700] }]}>Loading…</Text> : null}
      {feed.status === 'error' ? (
        <View style={{ gap: 10, alignItems: 'flex-start' }}>
          <Text style={body(15)}>Couldn’t load pages.</Text>
          <Button label="Try again" variant="outline" height={44} onPress={() => void feed.refresh()} />
        </View>
      ) : null}
      {feed.status === 'ready' && feed.posts.length === 0 ? (
        <Text style={[body(15, 'body', 1.45), { color: ramp.neutral[700] }]}>{tab === 'friends' ? 'No pages from friends yet.' : 'No public pages yet.'}</Text>
      ) : null}

      {feed.posts.map((p) => (
        <PostCard key={p.id} post={p} onOpenProfile={() => openProfile(p.author.id)} onReact={(kind) => void react(p.id, kind)} />
      ))}

      {feed.hasMore ? (
        <View style={{ alignItems: 'flex-start', gap: 6 }}>
          {feed.loadMoreFailed ? <Text style={[body(13), { color: ramp.accent[700] }]}>Couldn’t load more.</Text> : null}
          <Button label="Load more" variant="outline" height={44} disabled={feed.loadingMore} onPress={() => void feed.loadMore()} />
        </View>
      ) : null}

      <AddFriendSheet visible={adding} onClose={() => setAdding(false)} onFound={openProfile} />
    </Screen>
  );
}
