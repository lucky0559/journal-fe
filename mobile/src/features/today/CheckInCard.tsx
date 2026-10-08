import { Text, View } from 'react-native';
import { MOODS, moodIndex } from '@/lib/mood';
import { useCheckin } from '@/state/checkinStore';
import { radii, ramp, colors } from '@/theme/tokens';
import { body, heading } from '@/theme/type';
import { Chip } from '@/ui/Chip';
import { MoodBlob } from '@/ui/MoodBlob';
import { MoodSlider } from '@/ui/MoodSlider';
import { FEELINGS } from './deck';

export function CheckInCard() {
  const { mood, feelings, setMood, toggleFeeling } = useCheckin();
  const [label, hint] = MOODS[moodIndex(mood)];
  return (
    <View style={{ backgroundColor: colors.surface, borderRadius: radii.container, paddingTop: 22, paddingHorizontal: 20, paddingBottom: 18, gap: 18 }}>
      <Text style={body(15, 'semi')}>How are you arriving?</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
        <MoodBlob value={mood} size={88} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={heading(30)}>{label}</Text>
          <Text style={[body(13), { color: ramp.neutral[700] }]}>{hint}</Text>
        </View>
      </View>
      <MoodSlider value={mood} onChange={setMood} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: -10 }}>
        <Text style={[body(12), { color: ramp.neutral[700] }]}>Heavy</Text>
        <Text style={[body(12), { color: ramp.neutral[700] }]}>Bright</Text>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {FEELINGS.map((f) => (
          <Chip key={f} label={f} selected={feelings.includes(f)} onPress={() => toggleFeeling(f)} />
        ))}
      </View>
    </View>
  );
}
