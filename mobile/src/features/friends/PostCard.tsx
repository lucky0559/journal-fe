import { Pressable, Text, View } from 'react-native';
import { personById } from '@/domain/social';
import type { Post } from '@/domain/types';
import { VIS } from '@/domain/visibility';
import { useSocial } from '@/state/socialStore';
import { colors, radii, ramp, shadows } from '@/theme/tokens';
import { body, heading } from '@/theme/type';
import { Avatar } from '@/ui/Avatar';
import { PhotoTile } from '@/ui/PhotoTile';

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

export function PostCard({ post, variant = 'feed', onOpenProfile }: { post: Post; variant?: 'feed' | 'profile'; onOpenProfile?: () => void }) {
  const author = personById(post.authorId);
  const mine = useSocial((s) => s.reacts[post.id]) ?? {};
  const toggle = useSocial((s) => s.toggleReact);
  const v = VIS[post.vis];
  const tag = (
    <View style={{ paddingVertical: 3, paddingHorizontal: 10, borderRadius: radii.pill, backgroundColor: v.iconBg }}>
      <Text style={[body(11, 'bold'), { color: v.fg }]}>{v.label}</Text>
    </View>
  );
  const feed = variant === 'feed';
  return (
    <View style={[{ backgroundColor: ramp.neutral[100], borderRadius: radii.card, paddingVertical: 16, paddingHorizontal: 18, gap: feed ? 12 : 10 }, shadows.sm]}>
      {feed ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Avatar initial={author.initial} color={author.color} onPress={onOpenProfile} />
          <Pressable accessibilityRole="button" accessibilityLabel={`${author.name}, ${post.when}`} onPress={onOpenProfile} style={{ flex: 1, alignItems: 'flex-start' }}>
            <Text style={body(15, 'bold')}>{author.name}</Text>
            <Text style={[body(12), { color: ramp.neutral[700] }]}>{post.when}</Text>
          </Pressable>
          {tag}
        </View>
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={[body(12, 'semi'), { color: ramp.neutral[700], flex: 1 }]}>{post.when}</Text>
          {tag}
        </View>
      )}
      {post.prompt ? <Text style={[heading(16, 1.3), { color: ramp.accent[800] }]}>{post.prompt}</Text> : null}
      <Text style={body(16, 'body', 1.5)}>{post.text}</Text>
      {post.photoLabel ? <PhotoTile height={feed ? 170 : 150} radius={22} label={post.photoLabel} /> : null}
      {feed ? (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Reaction label="Sending a hug" count={post.hug + (mine.hug ? 1 : 0)} on={!!mine.hug} onPress={() => toggle(post.id, 'hug')} />
          <Reaction label="Same" count={post.same + (mine.same ? 1 : 0)} on={!!mine.same} onPress={() => toggle(post.id, 'same')} />
        </View>
      ) : null}
    </View>
  );
}
