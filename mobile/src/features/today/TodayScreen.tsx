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
import { Lumi } from '@/ui/Lumi';
import { Rise } from '@/ui/Rise';
import { EntryCard } from '@/ui/EntryCard';
import { Screen } from '@/ui/Screen';
import { NotificationBell } from '@/features/notifications/NotificationBell';
import { LatestTile, MonthTile } from './BentoTiles';
import { CheckInCard } from './CheckInCard';
import { PromptDeck } from './PromptDeck';

export function TodayScreen() {
  const router = useRouter();
  const name = useSettings((s) => s.settings.name);
  const entries = useEntries((s) => s.entries);
  const moodIdx = useCheckin((s) => moodIndex(s.mood)); // the bucket, not the exact value, so dragging doesn't redraw the screen
  const today = todayIso();
  const openPage = (id: string) => router.push({ pathname: '/page/[id]', params: { id } });

  return (
    <Screen>
      <Rise style={{ gap: 24 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={[body(13, 'semi'), { color: ramp.neutral[700] }]}>{fmtLong(today)}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <NotificationBell />
            <Avatar initial={(name || 'M').trim().charAt(0).toUpperCase()} onPress={() => router.navigate('/me')} />
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={[heading(34, 1.08), { flex: 1 }]}>{`${greeting(new Date().getHours())}, ${name || 'friend'}.`}</Text>
          <Lumi size={78} />
        </View>
      </Rise>
      <Rise index={1}><CheckInCard /></Rise>
      <Rise index={2}><PromptDeck moodIdx={moodIdx} onWrite={(prompt) => router.push({ pathname: '/write', params: { prompt } })} /></Rise>
      <Rise index={3} style={{ gap: 12 }}>
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
        {entries.length > 0 ? (
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <LatestTile entry={entries[0]} onPress={() => openPage(entries[0].id)} />
            <MonthTile
              entries={entries}
              today={today}
              onPress={() => { useTimelineUi.getState().setMode('cal'); router.navigate('/timeline'); }}
            />
          </View>
        ) : null}
        {entries.slice(1, 2).map((e) => (
          <EntryCard key={e.id} entry={e} onPress={() => openPage(e.id)} />
        ))}
        {entries.length === 0 ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <Lumi size={64} />
            <Text style={[body(15), { color: ramp.neutral[700], flex: 1 }]}>Your first page is one tap away.</Text>
          </View>
        ) : null}
      </Rise>
    </Screen>
  );
}
