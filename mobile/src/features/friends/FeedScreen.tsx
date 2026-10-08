import { useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { POSTS, feedFor } from '@/domain/social';
import { useSocial } from '@/state/socialStore';
import { ramp } from '@/theme/tokens';
import { body, heading } from '@/theme/type';
import { Screen } from '@/ui/Screen';
import { Segmented } from '@/ui/Segmented';
import { PostCard } from './PostCard';

export function FeedScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<'friends' | 'public'>('friends');
  const stateOf = useSocial((s) => s.stateOf);
  useSocial((s) => s.overrides); // re-render when a friendship changes
  const posts = feedFor(tab, POSTS, stateOf);
  return (
    <Screen gap={18} bottomPad={30}>
      <View style={{ gap: 14 }}>
        <Text style={heading(32)}>Others’ pages</Text>
        <Segmented options={[{ key: 'friends', label: 'Friends' }, { key: 'public', label: 'Public' }]} value={tab} onChange={setTab} />
        <Text style={[body(13, 'body', 1.45), { color: ramp.neutral[700] }]}>
          {tab === 'friends' ? 'Pages your friends chose to share with you.' : 'Pages anyone has made public. Tap a name to see more.'}
        </Text>
      </View>
      {posts.map((p) => (
        <PostCard key={p.id} post={p} onOpenProfile={() => router.push({ pathname: '/friends/[id]', params: { id: p.authorId } })} />
      ))}
    </Screen>
  );
}
