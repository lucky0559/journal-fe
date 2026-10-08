import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { countLabel, friendButton, lockedNote } from '@/domain/profileCopy';
import { PEOPLE, POSTS, personById, profileView } from '@/domain/social';
import { useSocial } from '@/state/socialStore';
import { useToast } from '@/state/toastStore';
import { colors, radii, ramp } from '@/theme/tokens';
import { body, heading } from '@/theme/type';
import { Icon } from '@/ui/Icon';
import { Screen } from '@/ui/Screen';
import { PostCard } from './PostCard';

export function ProfileScreen({ personId }: { personId: string }) {
  const router = useRouter();
  const stateOf = useSocial((s) => s.stateOf);
  useSocial((s) => s.overrides);
  const toggleFriend = useSocial((s) => s.toggleFriend);
  const show = useToast((s) => s.show);

  const back = (
    <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={{ width: 44, height: 44, marginLeft: -10, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name="arrow-left" size={22} />
    </Pressable>
  );
  if (!PEOPLE.some((p) => p.id === personId)) {
    return (
      <Screen topPad={6} bottomPad={30} gap={18}>
        {back}
        <Text style={body(16)}>We couldn’t find that profile.</Text>
      </Screen>
    );
  }

  const person = personById(personId);
  const state = stateOf(personId);
  const { visible, hidden } = profileView(personId, POSTS, stateOf);
  const btn = friendButton(state);
  const note = lockedNote(hidden);

  return (
    <Screen topPad={6} bottomPad={30} gap={18}>
      {back}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <View style={{ width: 76, height: 76, borderRadius: 38, backgroundColor: person.color, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={heading(32, 1)}>{person.initial}</Text>
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={heading(28)}>{person.name}</Text>
          <Text style={[body(14, 'body', 1.4), { color: ramp.neutral[700] }]}>{person.bio}</Text>
        </View>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={btn.label}
        onPress={() => {
          if (toggleFriend(personId) === 'requested') show(`Friend request sent to ${person.name}`);
        }}
        style={{ alignSelf: 'flex-start', height: 44, paddingHorizontal: 20, borderRadius: radii.pill, borderWidth: 1.5, justifyContent: 'center', borderColor: btn.filled ? colors.accent : colors.divider, backgroundColor: btn.filled ? colors.accent : 'transparent' }}
      >
        <Text style={[heading(15, 1), { color: btn.filled ? colors.bg : colors.text }]}>{btn.label}</Text>
      </Pressable>
      <Text style={body(15, 'semi')}>{countLabel(visible.length)}</Text>
      {visible.map((p) => <PostCard key={p.id} post={p} variant="profile" />)}
      {note ? (
        <View style={{ borderWidth: 2, borderStyle: 'dashed', borderColor: ramp.neutral[400], borderRadius: 28, padding: 18 }}>
          <Text style={[body(14, 'body', 1.45), { color: ramp.neutral[700] }]}>{note}</Text>
        </View>
      ) : null}
    </Screen>
  );
}
