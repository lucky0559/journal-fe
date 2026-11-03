import { Pressable, Text, View } from 'react-native';
import { summarizeEntry } from '@/domain/entrySummary';
import type { Entry } from '@/domain/types';
import { moodColor } from '@/lib/mood';
import { pagesInMonth, recentDays } from '@/lib/recentDays';
import { colors, radii, ramp, shadows } from '@/theme/tokens';
import { body, heading } from '@/theme/type';
import { CountUp } from '@/ui/CountUp';

const COLUMNS = 7;

const tile = () => [{ flex: 1, backgroundColor: ramp.neutral[100], borderRadius: radii.card, padding: 16, gap: 10, minHeight: 168 }, shadows.sm];

/** The last four weeks as a grid of mood-coloured dots, with how many pages this month. Tap for the calendar. */
export function MonthTile({ entries, today, onPress }: { entries: Entry[]; today: string; onPress: () => void }) {
  const days = recentDays(entries, today);
  const count = pagesInMonth(entries, today);
  const rows = Array.from({ length: days.length / COLUMNS }, (_, r) => days.slice(r * COLUMNS, (r + 1) * COLUMNS));
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`This month, ${count} ${count === 1 ? 'page' : 'pages'}. Open the calendar`}
      onPress={onPress}
      style={tile()}
    >
      <Text style={[body(11, 'bold'), { color: ramp.neutral[600], letterSpacing: 1, textTransform: 'uppercase' }]}>This month</Text>
      <CountUp value={count} style={heading(34, 1)} />
      <View style={{ gap: 5, marginTop: 'auto' }}>
        {rows.map((row, r) => (
          <View key={r} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            {row.map((d) => (
              <View
                key={d.iso}
                style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: d.mood === null ? colors.divider : moodColor(d.mood) }}
              />
            ))}
          </View>
        ))}
      </View>
    </Pressable>
  );
}

/** The newest page, as a tile. */
export function LatestTile({ entry, onPress }: { entry: Entry; onPress: () => void }) {
  const s = summarizeEntry(entry);
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={s.text} onPress={onPress} style={tile()}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: s.color }} />
        <Text style={[body(11, 'bold'), { color: ramp.neutral[600], letterSpacing: 1, textTransform: 'uppercase' }]}>Latest page</Text>
      </View>
      <Text numberOfLines={5} style={body(15, 'body', 1.45)}>{s.text}</Text>
      <Text style={[body(12, 'semi'), { color: ramp.neutral[700], marginTop: 'auto' }]}>{`${s.dateLabel} · ${s.moodLabel}`}</Text>
    </Pressable>
  );
}
