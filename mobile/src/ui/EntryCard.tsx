import { Pressable, Text, View } from 'react-native';
import { summarizeEntry } from '@/domain/entrySummary';
import type { Entry } from '@/domain/types';
import { radii, ramp, shadows } from '@/theme/tokens';
import { body } from '@/theme/type';

interface Props { entry: Entry; onPress: () => void; variant?: 'date' | 'time'; lines?: number }

export function EntryCard({ entry, onPress, variant = 'date', lines = 3 }: Props) {
  const s = summarizeEntry(entry);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={s.text}
      onPress={onPress}
      style={({ pressed }) => [
        { backgroundColor: pressed ? ramp.accent[100] : ramp.neutral[100], borderRadius: radii.card, paddingVertical: 16, paddingHorizontal: 18, gap: 8 },
        shadows.sm,
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: s.color }} />
        <Text style={[body(12, 'semi'), { color: ramp.neutral[700] }]}>
          {variant === 'date' ? s.dateLabel : s.time} · {s.moodLabel}
        </Text>
        {s.visLabel ? (
          <View style={{ marginLeft: 'auto', paddingVertical: 3, paddingHorizontal: 10, borderRadius: radii.pill, backgroundColor: s.visBg }}>
            <Text style={[body(11, 'bold'), { color: s.visFg }]}>{s.visLabel}</Text>
          </View>
        ) : null}
      </View>
      <Text testID="entry-text" numberOfLines={lines || undefined} style={body(16, 'body', 1.45)}>
        {s.text}
      </Text>
      {s.meta ? <Text style={[body(12, 'semi'), { color: ramp.accent2[700] }]}>{s.meta}</Text> : null}
    </Pressable>
  );
}
