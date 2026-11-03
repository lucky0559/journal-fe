import { useCallback, useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { ApiUser } from '@/api/types';
import { social } from '@/social';
import { avatarColor, initialOf } from '@/social/postView';
import { useToast } from '@/state/toastStore';
import { body, heading } from '@/theme/type';
import { ramp } from '@/theme/tokens';
import { Avatar } from '@/ui/Avatar';
import { Button } from '@/ui/Button';
import { Icon } from '@/ui/Icon';
import { Screen } from '@/ui/Screen';

type Load = { status: 'loading' } | { status: 'error' } | { status: 'ready'; people: ApiUser[] };

/** The people you blocked, with a way to undo it. */
export function BlockedScreen() {
  const router = useRouter();
  const [state, setState] = useState<Load>({ status: 'loading' });

  const load = useCallback(async () => {
    setState({ status: 'loading' });
    try {
      setState({ status: 'ready', people: await social.blocked() });
    } catch {
      setState({ status: 'error' });
    }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const unblock = async (p: ApiUser) => {
    try {
      await social.unblock(p.id);
      setState((s) => (s.status === 'ready' ? { status: 'ready', people: s.people.filter((x) => x.id !== p.id) } : s));
      useToast.getState().show(`${p.name} is unblocked`);
    } catch {
      useToast.getState().show('Couldn’t unblock them. Try again.');
    }
  };

  return (
    <Screen topPad={6} bottomPad={30} gap={16}>
      <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={{ width: 44, height: 44, marginLeft: -10, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="arrow-left" size={22} />
      </Pressable>
      <Text style={heading(32)}>Blocked people</Text>
      <Text style={[body(14, 'body', 1.45), { color: ramp.neutral[700] }]}>You don’t see their pages and they don’t see yours. They aren’t told.</Text>

      {state.status === 'loading' ? <Text style={[body(15), { color: ramp.neutral[700] }]}>Loading…</Text> : null}
      {state.status === 'error' ? (
        <View style={{ gap: 10, alignItems: 'flex-start' }}>
          <Text style={body(15)}>Couldn’t load this list.</Text>
          <Button label="Try again" variant="outline" height={44} onPress={() => void load()} />
        </View>
      ) : null}
      {state.status === 'ready' && state.people.length === 0 ? <Text style={[body(15), { color: ramp.neutral[700] }]}>You haven’t blocked anyone.</Text> : null}
      {state.status === 'ready'
        ? state.people.map((p) => (
            <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <Avatar initial={initialOf(p.name)} color={avatarColor(p.id)} />
              <Text style={[body(16, 'semi'), { flex: 1 }]}>{p.name}</Text>
              <Button label="Unblock" variant="outline" height={40} fontSize={14} onPress={() => void unblock(p)} />
            </View>
          ))
        : null}
    </Screen>
  );
}
