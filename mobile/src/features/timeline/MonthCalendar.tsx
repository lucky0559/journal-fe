import { Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { Entry } from '@/domain/types';
import { monthGrid, type DayCell } from '@/lib/calendar';
import { MONTHS, fmtLong } from '@/lib/dates';
import { moodColor } from '@/lib/mood';
import { colors, radii, ramp } from '@/theme/tokens';
import { body, heading } from '@/theme/type';
import { Icon } from '@/ui/Icon';

interface Props {
  year: number; month: number; today: string; selDay: string; entries: Entry[];
  onSelect: (iso: string) => void; onPrev: () => void; onNext: () => void;
}

export function MonthCalendar({ year, month, today, selDay, entries, onSelect, onPrev, onNext }: Props) {
  const { offset, days } = monthGrid(year, month, today, entries);
  return (
    <View style={{ backgroundColor: colors.surface, borderRadius: radii.container, paddingTop: 16, paddingHorizontal: 14, paddingBottom: 18, gap: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <NavButton label="Previous month" icon="chevron-left" onPress={onPrev} />
        <Text style={heading(20)}>{`${MONTHS[month]} ${year}`}</Text>
        <NavButton label="Next month" icon="chevron-right" onPress={onNext} />
      </View>
      <View style={{ flexDirection: 'row' }}>
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <Text key={i} style={[body(11, 'bold'), { flex: 1, textAlign: 'center', color: ramp.neutral[700] }]}>{d}</Text>
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 6 }}>
        {Array.from({ length: offset }, (_, i) => <View key={`b${i}`} style={{ width: `${100 / 7}%` }} />)}
        {days.map((d) => (
          <View key={d.iso} style={{ width: `${100 / 7}%`, alignItems: 'center' }}>
            <Day d={d} selected={d.iso === selDay} onPress={() => onSelect(d.iso)} />
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 6 }}>
        <Text style={[body(11), { color: ramp.neutral[700] }]}>Heavy</Text>
        <LinearGradient colors={[ramp.accent2[600], ramp.accent[500]]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ width: 72, height: 8, borderRadius: 4 }} />
        <Text style={[body(11), { color: ramp.neutral[700] }]}>Bright</Text>
      </View>
    </View>
  );
}

function NavButton({ label, icon, onPress }: { label: string; icon: 'chevron-left' | 'chevron-right'; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? ramp.neutral[300] : 'transparent' })}
    >
      <Icon name={icon} size={20} />
    </Pressable>
  );
}

function Day({ d, selected, onPress }: { d: DayCell; selected: boolean; onPress: () => void }) {
  const has = d.count > 0;
  const fg = has ? ramp.neutral[100] : d.future ? ramp.neutral[500] : colors.text;
  const label = `${fmtLong(d.iso)}${has ? `, ${d.count} ${d.count === 1 ? 'page' : 'pages'}` : ''}`;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: d.future, selected }}
      disabled={d.future}
      onPress={onPress}
      hitSlop={3}
      style={{ width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: has ? moodColor(d.avgMood as number) : 'transparent' }}
    >
      {d.today ? <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 19, borderWidth: 2, borderColor: colors.accent }} /> : null}
      {selected ? <View pointerEvents="none" style={{ position: 'absolute', top: -4.5, left: -4.5, right: -4.5, bottom: -4.5, borderRadius: 23.5, borderWidth: 2.5, borderColor: colors.text }} /> : null}
      <Text style={[body(13, has || d.today ? 'bold' : 'body'), { color: fg }]}>{d.day}</Text>
    </Pressable>
  );
}
