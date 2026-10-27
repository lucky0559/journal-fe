import { Pressable, Text, View } from 'react-native';
import type { ApiPost, ReactionKind } from '@/api/types';
import { VIS } from '@/domain/visibility';
import { todayIso } from '@/lib/dates';
import { avatarColor, initialOf, whenLabel } from '@/social/postView';
import { colors, radii, ramp, shadows } from '@/theme/tokens';
import { body, heading } from '@/theme/type';
import { Avatar } from '@/ui/Avatar';
import { PhotoTile } from '@/ui/PhotoTile';
import { VoicePill } from '@/features/write/VoicePill';

function Reaction({ label, count, on, onPress }: { label: string; count: number; on: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      onPress={onPress}
      hitSlop={{ top: 4, bottom: 4 }}
      style={{ height: 36, paddingHorizontal: 14, borderRadius: radii.pill, borderWidth: 1.5, justifyContent: 'center', borderColor: on ? colors.accent : colors.divider, backgroundColor: on ? ramp.accent[200] : 'transparent' }}
    >
      <Text style={[body(13, 'semi'), { color: on ? ramp.accent[900] : ramp.neutral[800] }]}>{`${label} · ${count}`}</Text>
    </Pressable>
  );
}

interface Props {
  post: ApiPost;
  variant?: 'feed' | 'profile';
  onOpenProfile?: () => void;
  onReact?: (kind: ReactionKind) => void;
}

export function PostCard({ post, variant = 'feed', onOpenProfile, onReact }: Props) {
  const v = VIS[post.vis];
  const when = whenLabel(post, todayIso());
  const feed = variant === 'feed';
  const tag = (
    <View style={{ paddingVertical: 3, paddingHorizontal: 10, borderRadius: radii.pill, backgroundColor: v.iconBg }}>
      <Text style={[body(11, 'bold'), { color: v.fg }]}>{v.label}</Text>
    </View>
  );
  return (
    <View style={[{ backgroundColor: ramp.neutral[100], borderRadius: radii.card, paddingVertical: 16, paddingHorizontal: 18, gap: feed ? 12 : 10 }, shadows.sm]}>
      {feed ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Avatar initial={initialOf(post.author.name)} color={avatarColor(post.author.id)} onPress={onOpenProfile} />
          <Pressable accessibilityRole="button" accessibilityLabel={`${post.author.name}, ${when}`} onPress={onOpenProfile} style={{ flex: 1, alignItems: 'flex-start' }}>
            <Text style={body(15, 'bold')}>{post.author.name}</Text>
            <Text style={[body(12), { color: ramp.neutral[700] }]}>{when}</Text>
          </Pressable>
          {tag}
        </View>
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={[body(12, 'semi'), { color: ramp.neutral[700], flex: 1 }]}>{when}</Text>
          {tag}
        </View>
      )}
      {post.prompt ? <Text style={[heading(16, 1.3), { color: ramp.accent[800] }]}>{post.prompt}</Text> : null}
      {post.text ? <Text style={body(16, 'body', 1.5)}>{post.text}</Text> : null}
      {post.photos.map((p) => <PhotoTile key={p.key} height={feed ? 170 : 150} radius={22} uri={p.url} />)}
      {post.voices.length ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {post.voices.map((vn) => <VoicePill key={vn.key} voice={{ id: vn.key, uri: vn.url, seconds: vn.seconds }} />)}
        </View>
      ) : null}
      {post.stickers.length ? <Text style={[body(12, 'semi'), { color: ramp.accent2[700] }]}>{post.stickers.join(', ')}</Text> : null}
      {feed && onReact ? (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Reaction label="Sending a hug" count={post.hug} on={post.mine.hug} onPress={() => onReact('hug')} />
          <Reaction label="Same" count={post.same} on={post.mine.same} onPress={() => onReact('same')} />
        </View>
      ) : null}
    </View>
  );
}
