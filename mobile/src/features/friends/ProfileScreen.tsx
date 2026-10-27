import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ApiError } from '@/api/client';
import type { ApiProfile } from '@/api/types';
import { countLabel, friendButton, lockedNote } from '@/domain/profileCopy';
import type { FriendState } from '@/domain/types';
import { social } from '@/social';
import { avatarColor, initialOf } from '@/social/postView';
import { usePagedPosts } from '@/social/usePagedPosts';
import { useToast } from '@/state/toastStore';
import { colors, radii, ramp } from '@/theme/tokens';
import { body, heading } from '@/theme/type';
import { Button } from '@/ui/Button';
import { Icon } from '@/ui/Icon';
import { Screen } from '@/ui/Screen';
import { PostCard } from './PostCard';
import { UPDATE_FAILED } from './useIncomingRequests';

type Load = { status: 'loading' } | { status: 'error' } | { status: 'notfound' } | { status: 'ready'; profile: ApiProfile };

export function ProfileScreen({ personId }: { personId: string }) {
  const router = useRouter();
  const [load, setLoad] = useState<Load>({ status: 'loading' });
  const [busy, setBusy] = useState(false);
  const posts = usePagedPosts({ key: personId, fetchPage: (before) => social.userPosts(personId, before), social });

  const fetchProfile = useCallback(async () => {
    setLoad({ status: 'loading' });
    try {
      setLoad({ status: 'ready', profile: await social.user(personId) });
    } catch (e) {
      setLoad({ status: e instanceof ApiError && e.status === 404 ? 'notfound' : 'error' });
    }
  }, [personId]);
  useEffect(() => { void fetchProfile(); }, [fetchProfile]);

  const back = (
    <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={{ width: 44, height: 44, marginLeft: -10, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name="arrow-left" size={22} />
    </Pressable>
  );

  if (load.status === 'loading') return <Screen topPad={6} bottomPad={30} gap={18}>{back}<Text style={[body(15), { color: ramp.neutral[700] }]}>Loading…</Text></Screen>;
  if (load.status === 'notfound') return <Screen topPad={6} bottomPad={30} gap={18}>{back}<Text style={body(16)}>We couldn’t find that profile.</Text></Screen>;
  if (load.status === 'error') {
    return (
      <Screen topPad={6} bottomPad={30} gap={18}>
        {back}
        <Text style={body(16)}>Couldn’t load this profile.</Text>
        <Button label="Try again" variant="outline" height={44} onPress={() => void fetchProfile()} />
      </Screen>
    );
  }

  const person = load.profile;
  const state = person.friendState;
  const btn = friendButton(state);
  const note = lockedNote(posts.hidden);

  /** Run a friend action; on success move to the new state and reload the pages (what you may read just changed). */
  const act = async (fn: () => Promise<FriendState | void>, toast?: (next: FriendState) => string | undefined) => {
    if (busy) return;
    setBusy(true);
    try {
      const next = (await fn()) ?? undefined;
      const resolved: FriendState = next ?? 'none';
      setLoad({ status: 'ready', profile: { ...person, friendState: resolved } });
      const msg = toast?.(resolved);
      if (msg) useToast.getState().show(msg);
      void posts.refresh();
    } catch {
      useToast.getState().show(UPDATE_FAILED);
    } finally {
      setBusy(false);
    }
  };

  const onMainPress = () => {
    if (state === 'none') {
      void act(() => social.requestFriend(person.id), (n) => (n === 'friends' ? `You and ${person.name} are now friends` : `Friend request sent to ${person.name}`));
    } else if (state === 'requested') {
      void act(async () => { await social.cancelRequest(person.id); return 'none'; });
    } else if (state === 'incoming') {
      void act(() => social.accept(person.id), () => `You and ${person.name} are now friends`);
    } else if (state === 'friends') {
      Alert.alert(`Remove ${person.name}?`, 'You will stop seeing each other’s Friends pages.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => void act(async () => { await social.unfriend(person.id); return 'none'; }) },
      ]);
    }
  };

  return (
    <Screen topPad={6} bottomPad={30} gap={18}>
      {back}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <View style={{ width: 76, height: 76, borderRadius: 38, backgroundColor: avatarColor(person.id), alignItems: 'center', justifyContent: 'center' }}>
          <Text style={heading(32, 1)}>{initialOf(person.name)}</Text>
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={heading(28)}>{person.name}</Text>
          {person.bio ? <Text style={[body(14, 'body', 1.4), { color: ramp.neutral[700] }]}>{person.bio}</Text> : null}
        </View>
      </View>

      {state === 'self' ? (
        <Text style={[body(14, 'semi'), { color: ramp.neutral[700] }]}>{btn.label}</Text>
      ) : (
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={btn.label}
            disabled={busy}
            onPress={onMainPress}
            style={{ height: 44, paddingHorizontal: 20, borderRadius: radii.pill, borderWidth: 1.5, justifyContent: 'center', opacity: busy ? 0.6 : 1, borderColor: btn.filled ? colors.accent : colors.divider, backgroundColor: btn.filled ? colors.accent : 'transparent' }}
          >
            <Text style={[heading(15, 1), { color: btn.filled ? colors.bg : colors.text }]}>{btn.label}</Text>
          </Pressable>
          {state === 'incoming' ? (
            <Button label="Decline" variant="outline" height={44} disabled={busy} onPress={() => void act(async () => { await social.decline(person.id); return 'none'; })} />
          ) : null}
        </View>
      )}

      {posts.status === 'ready' ? <Text style={body(15, 'semi')}>{countLabel(posts.posts.length)}</Text> : null}
      {posts.status === 'error' ? (
        <View style={{ gap: 10, alignItems: 'flex-start' }}>
          <Text style={body(15)}>Couldn’t load pages.</Text>
          <Button label="Try again" variant="outline" height={44} onPress={() => void posts.refresh()} />
        </View>
      ) : null}
      {posts.posts.map((p) => <PostCard key={p.id} post={p} variant="profile" />)}
      {posts.hasMore ? <Button label="Load more" variant="outline" height={44} disabled={posts.loadingMore} onPress={() => void posts.loadMore()} /> : null}
      {note ? (
        <View style={{ borderWidth: 2, borderStyle: 'dashed', borderColor: ramp.neutral[400], borderRadius: 28, padding: 18 }}>
          <Text style={[body(14, 'body', 1.45), { color: ramp.neutral[700] }]}>{note}</Text>
        </View>
      ) : null}
    </Screen>
  );
}
