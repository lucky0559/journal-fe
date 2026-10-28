import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { fmtLong, todayIso } from '@/lib/dates';
import { useEntries } from '@/state';
import { useTimelineUi } from '@/state/timelineStore';
import { ramp } from '@/theme/tokens';
import { body, heading } from '@/theme/type';
import { Button } from '@/ui/Button';
import { EntryCard } from '@/ui/EntryCard';
import { Screen } from '@/ui/Screen';
import { Segmented } from '@/ui/Segmented';
import { MonthCalendar } from './MonthCalendar';
import { groupByMonth } from './groupByMonth';

export function TimelineScreen() {
  const router = useRouter();
  const entries = useEntries((s) => s.entries);
  const { mode, year, month, selDay, setMode, select, shift } = useTimelineUi();
  const today = todayIso();
  const open = (id: string) => router.push({ pathname: '/page/[id]', params: { id } });
  const dayEntries = entries.filter((e) => e.date === selDay);

  return (
    <Screen gap={20}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={heading(32)}>Your pages</Text>
        <Segmented options={[{ key: 'cal', label: 'Calendar' }, { key: 'list', label: 'List' }]} value={mode} onChange={setMode} />
      </View>

      {mode === 'cal' ? (
        <>
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
          {entries.length === 0 ? <Text style={[body(15), { color: ramp.neutral[700] }]}>No pages yet. Your first one is a tap away.</Text> : null}
        </View>
      )}
    </Screen>
  );
}
