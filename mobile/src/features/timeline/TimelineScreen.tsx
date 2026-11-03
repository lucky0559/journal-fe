import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { fmtLong, todayIso } from '@/lib/dates';
import { MOODS, moodColor, moodIndex } from '@/lib/mood';
import { monthStats } from '@/lib/monthStats';
import { useEntries } from '@/state';
import { useTimelineUi } from '@/state/timelineStore';
import { ramp } from '@/theme/tokens';
import { body, heading } from '@/theme/type';
import { Button } from '@/ui/Button';
import { EntryCard } from '@/ui/EntryCard';
import { Screen } from '@/ui/Screen';
import { Segmented } from '@/ui/Segmented';
import { EmptyNote } from '@/ui/EmptyNote';
import { Rise } from '@/ui/Rise';
import { StatTile } from '@/ui/StatTile';
import { MonthCalendar } from './MonthCalendar';
import { groupByMonth } from './groupByMonth';

export function TimelineScreen() {
  const router = useRouter();
  const entries = useEntries((s) => s.entries);
  const { mode, year, month, selDay, setMode, select, shift } = useTimelineUi();
  const today = todayIso();
  const open = (id: string) => router.push({ pathname: '/page/[id]', params: { id } });
  const dayEntries = entries.filter((e) => e.date === selDay);
  const stats = monthStats(entries, year, month);

  return (
    <Screen gap={20}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={heading(32)}>Your pages</Text>
        <Segmented options={[{ key: 'cal', label: 'Calendar' }, { key: 'list', label: 'List' }]} value={mode} onChange={setMode} />
      </View>

      {mode === 'cal' ? (
        <>
          <Rise style={{ flexDirection: 'row', gap: 12 }}>
            <StatTile label="Pages" value={stats.pages} sub={stats.pages ? `on ${stats.days} ${stats.days === 1 ? 'day' : 'days'}` : 'none this month'} />
            <StatTile
              label="Mood"
              value={stats.mood === null ? '·' : MOODS[moodIndex(stats.mood)][0]}
              sub={stats.mood === null ? 'nothing to average' : 'on average'}
              dot={stats.mood === null ? undefined : moodColor(stats.mood)}
            />
          </Rise>
          <MonthCalendar
            year={year} month={month} today={today} selDay={selDay} entries={entries}
            onSelect={select} onPrev={() => shift(-1)} onNext={() => shift(1)}
          />
          <View style={{ gap: 12 }}>
            <Text style={body(15, 'semi')}>{selDay === today ? 'Today' : fmtLong(selDay)}</Text>
            {dayEntries.map((e) => (
              <EntryCard key={e.id} entry={e} variant="time" lines={0} onPress={() => open(e.id)} />
            ))}
            {dayEntries.length === 0 ? (
              <View style={{ borderWidth: 2, borderStyle: 'dashed', borderColor: ramp.neutral[400], borderRadius: 28, padding: 22, alignItems: 'flex-start', gap: 12 }}>
                <Text style={[body(15), { color: ramp.neutral[700] }]}>Nothing written this day.</Text>
                {selDay <= today ? (
                  <Button
                    label="Write for this day" variant="outline" height={44} fontSize={14}
                    onPress={() => router.push({ pathname: '/write', params: { date: selDay } })}
                  />
                ) : null}
              </View>
            ) : null}
          </View>
        </>
      ) : (
        <View style={{ gap: 12 }}>
          {groupByMonth(entries).map((g) => (
            <View key={g.title} style={{ gap: 12 }}>
              <Text style={[body(12, 'bold'), { color: ramp.accent[700], letterSpacing: 0.96, textTransform: 'uppercase', marginTop: 8 }]}>{g.title}</Text>
              {g.entries.map((e) => <EntryCard key={e.id} entry={e} onPress={() => open(e.id)} />)}
            </View>
          ))}
          {entries.length === 0 ? <EmptyNote text="No pages yet. Your first one is a tap away." /> : null}
        </View>
      )}
    </Screen>
  );
}
