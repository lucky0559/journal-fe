import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { moodIndex } from '@/lib/mood';
import { fmtLong, greeting, todayIso } from '@/lib/dates';
import { useEntries, useSettings } from '@/state';
import { useCheckin } from '@/state/checkinStore';
import { useTimelineUi } from '@/state/timelineStore';
import { ramp } from '@/theme/tokens';
import { body, heading } from '@/theme/type';
import { Avatar } from '@/ui/Avatar';
import { EntryCard } from '@/ui/EntryCard';
import { Screen } from '@/ui/Screen';
import { CheckInCard } from './CheckInCard';
import { PromptDeck } from './PromptDeck';

export function TodayScreen() {
  const router = useRouter();
  const name = useSettings((s) => s.settings.name);
  const entries = useEntries((s) => s.entries);
  const mood = useCheckin((s) => s.mood);
  const today = todayIso();

  return (
    <Screen>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={[body(13, 'semi'), { color: ramp.neutral[700] }]}>{fmtLong(today)}</Text>
        <Avatar initial={(name || 'M').trim().charAt(0).toUpperCase()} onPress={() => router.navigate('/me')} />
      </View>
      <Text style={heading(34, 1.08)}>{`${greeting(new Date().getHours())}, ${name || 'friend'}.`}</Text>
      <CheckInCard />
      <PromptDeck moodIdx={moodIndex(mood)} onWrite={(prompt) => router.push({ pathname: '/write', params: { prompt } })} />
      <View style={{ gap: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Text style={body(15, 'semi')}>Recent pages</Text>
          <Pressable
            accessibilityRole="button"
            hitSlop={12}
            onPress={() => { useTimelineUi.getState().setMode('list'); router.navigate('/timeline'); }}
          >
            <Text style={[body(13, 'semi'), { color: ramp.accent[700] }]}>See all</Text>
          </Pressable>
        </View>
        {entries.slice(0, 2).map((e) => (
          <EntryCard key={e.id} entry={e} onPress={() => router.push({ pathname: '/write', params: { entryId: e.id } })} />
        ))}
        {entries.length === 0 ? (
          <Text style={[body(15), { color: ramp.neutral[700] }]}>Your first page is one tap away.</Text>
        ) : null}
      </View>
    </Screen>
  );
}
