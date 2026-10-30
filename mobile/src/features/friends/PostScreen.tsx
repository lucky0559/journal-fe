import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApiError } from '@/api/client';
import type { ApiPost, ReactionKind } from '@/api/types';
import { blobFor, stickerStyle, tiltFor } from '@/domain/stickers';
import { visMeta } from '@/domain/visibility';
import { fmtParts } from '@/lib/dates';
import { social } from '@/social';
import { avatarColor, initialOf } from '@/social/postView';
import { useToast } from '@/state/toastStore';
import { colors, radii, ramp, shadows } from '@/theme/tokens';
import { body, heading } from '@/theme/type';
import { Polaroid } from '@/features/page/Polaroid';
import { RuledText } from '@/features/page/RuledText';
import { VoicePill } from '@/features/write/VoicePill';
import { Avatar } from '@/ui/Avatar';
import { Blob } from '@/ui/Blob';
import { Button } from '@/ui/Button';
import { Icon } from '@/ui/Icon';
import { Reaction } from './PostCard';
import { UPDATE_FAILED } from './useIncomingRequests';

type Load = { status: 'loading' } | { status: 'gone' } | { status: 'error' } | { status: 'ready'; post: ApiPost };

/**
 * Someone else's page, read the way you read your own: the same notebook paper, with who wrote it. It only ever has what
 * the author chose to share, so there is no mood or feelings here (the server never sends them).
 */
export function PostScreen() {
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [state, setState] = useState<Load>({ status: 'loading' });

  const close = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/friends'));

  const load = useCallback(async () => {
    if (!id) return setState({ status: 'gone' });
    setState({ status: 'loading' });
    try {
      setState({ status: 'ready', post: await social.post(id) });
    } catch (e) {
      setState(e instanceof ApiError && e.status === 404 ? { status: 'gone' } : { status: 'error' });
    }
  }, [id]);
  useEffect(() => { void load(); }, [load]);

  const react = async (kind: ReactionKind) => {
    if (state.status !== 'ready') return;
    const before = state.post;
    const on = !before.mine[kind];
    // Show the change at once, and put it back if the server says no.
    setState({ status: 'ready', post: { ...before, mine: { ...before.mine, [kind]: on }, [kind]: Math.max(0, before[kind] + (on ? 1 : -1)) } });
    try {
      await (on ? social.react(before.id, kind) : social.unreact(before.id, kind));
    } catch {
      setState({ status: 'ready', post: before });
      useToast.getState().show(UPDATE_FAILED);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: top }}>
      <View style={{ height: 60, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14 }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={close} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="arrow-left" size={22} />
        </Pressable>
      </View>

      {state.status === 'ready' ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 6, paddingBottom: bottom + 24 }}>
          <Paper
            post={state.post}
            onOpenProfile={() => router.push({ pathname: '/friends/[id]', params: { id: state.post.author.id } })}
            onReact={(kind) => void react(kind)}
          />
        </ScrollView>
      ) : state.status === 'loading' ? (
        <View style={{ paddingHorizontal: 22 }}>
          <Text style={[body(15), { color: ramp.neutral[700] }]}>Opening the page…</Text>
        </View>
      ) : (
        <View style={{ paddingHorizontal: 22, gap: 16, alignItems: 'flex-start' }}>
          <Text style={heading(28)}>{state.status === 'gone' ? 'This page isn’t available.' : 'Couldn’t load this page.'}</Text>
          {state.status === 'gone' ? (
            <Text style={[body(15, 'body', 1.5), { color: ramp.neutral[700] }]}>It may have been taken down, or it isn’t shared with you.</Text>
          ) : null}
          <Button label={state.status === 'gone' ? 'Back to the feed' : 'Try again'} variant="outline" height={48} onPress={state.status === 'gone' ? close : () => void load()} />
        </View>
      )}
    </View>
  );
}

function Paper({ post, onOpenProfile, onReact }: { post: ApiPost; onOpenProfile: () => void; onReact: (kind: ReactionKind) => void }) {
  const date = fmtParts(post.date);
  const vis = visMeta()[post.vis];
  const hasAttachments = post.photos.length > 0 || post.voices.length > 0 || post.stickers.length > 0;
  return (
    <View
      style={[
        { backgroundColor: ramp.neutral[100], borderRadius: 10, paddingTop: 26, paddingBottom: 28, paddingLeft: 54, paddingRight: 22, gap: 22, overflow: 'hidden', borderWidth: 1, borderColor: colors.divider },
        shadows.md,
      ]}
    >
      {/* the margin line of a notebook page */}
      <View pointerEvents="none" style={{ position: 'absolute', left: 38, top: 0, bottom: 0, width: 1.5, backgroundColor: ramp.accent[300], opacity: 0.8 }} />

      <View accessible accessibilityLabel={`${date.weekday} ${date.day} ${date.month} ${date.year}, ${post.time}`} style={{ gap: 2 }}>
        <Text style={[body(12, 'bold'), { color: ramp.accent[700], letterSpacing: 1.6, textTransform: 'uppercase' }]}>{date.weekday}</Text>
        <Text style={heading(40, 1.05)}>{`${date.day} ${date.month}`}</Text>
        <Text style={[body(13), { color: ramp.neutral[700] }]}>{`${date.year} · ${post.time}`}</Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${post.author.name}, see their profile`}
        onPress={onOpenProfile}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 12, alignSelf: 'flex-start' }}
      >
        <Avatar initial={initialOf(post.author.name)} color={avatarColor(post.author.id)} />
        <Text style={heading(19, 1.1)}>{post.author.name}</Text>
      </Pressable>

      {post.prompt ? (
        <View style={{ gap: 4 }}>
          <Text style={[body(11, 'bold'), { color: ramp.neutral[600], letterSpacing: 1, textTransform: 'uppercase' }]}>Prompt</Text>
          <Text style={[heading(20, 1.25), { color: ramp.accent[800] }]}>{`“${post.prompt}”`}</Text>
        </View>
      ) : null}

      {post.text.trim() ? <RuledText text={post.text} /> : null}

      {hasAttachments ? (
        <View style={{ gap: 18 }}>
          {post.photos.map((p, i) => <Polaroid key={p.key} uri={p.url} index={i} />)}
          {post.voices.length ? (
            <View style={{ gap: 10, alignItems: 'flex-start' }}>
              {post.voices.map((v) => <VoicePill key={v.key} voice={{ id: v.key, uri: v.url, seconds: v.seconds }} />)}
            </View>
          ) : null}
          {post.stickers.length ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              {post.stickers.map((name, i) => {
                const st = stickerStyle(name);
                return (
                  <Blob key={`${name}-${i}`} radii={blobFor(name)} size={66} color={st.bg} rotate={tiltFor(name)}>
                    <Text style={[heading(13, 1), { color: st.ink }]}>{name}</Text>
                  </Blob>
                );
              })}
            </View>
          ) : null}
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <Reaction label="Sending a hug" count={post.hug} on={post.mine.hug} onPress={() => onReact('hug')} />
        <Reaction label="Same" count={post.same} on={post.mine.same} onPress={() => onReact('same')} />
      </View>

      <View
        accessible
        accessibilityLabel={`${vis.label}. ${vis.desc}`}
        style={{ alignSelf: 'flex-start', height: 34, paddingHorizontal: 12, borderRadius: radii.pill, borderWidth: 1.5, borderColor: vis.border, backgroundColor: vis.bg, flexDirection: 'row', alignItems: 'center', gap: 7 }}
      >
        <Icon name={vis.icon} size={14} color={vis.fg} />
        <Text style={[body(12, 'semi'), { color: vis.fg }]}>{vis.label}</Text>
      </View>
    </View>
  );
}
