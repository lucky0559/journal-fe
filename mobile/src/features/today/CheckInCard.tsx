import { useState } from 'react';
import { Text, View } from 'react-native';
import { runOnJS, useAnimatedReaction, useSharedValue, type SharedValue } from 'react-native-reanimated';
import { MOODS, moodIndex } from '@/lib/mood';
import { useCheckin } from '@/state/checkinStore';
import { radii, ramp, colors } from '@/theme/tokens';
import { body, heading } from '@/theme/type';
import { Chip } from '@/ui/Chip';
import { LiveMoodBlob } from '@/ui/LiveMoodBlob';
import { MoodSlider } from '@/ui/MoodSlider';
import { FEELINGS } from './deck';

/**
 * The slider's live position is a shared value, so the blob follows the thumb frame for frame. The label only needs
 * React when the mood crosses into another bucket.
 */
export function CheckInCard() {
  const [initial] = useState(() => useCheckin.getState().mood);
  const position = useSharedValue(initial);
  return (
    <View style={{ backgroundColor: colors.surface, borderRadius: radii.container, paddingTop: 22, paddingHorizontal: 20, paddingBottom: 18, gap: 18 }}>
      <Text style={body(15, 'semi')}>How are you feeling today?</Text>
      <MoodReadout position={position} initial={initial} />
      <MoodControl position={position} />
      <FeelingChips />
    </View>
  );
}

function MoodReadout({ position, initial }: { position: SharedValue<number>; initial: number }) {
  const [bucket, setBucket] = useState(() => moodIndex(initial));
  useAnimatedReaction(
    () => moodIndex(position.value),
    (now, prev) => {
      if (now !== prev) runOnJS(setBucket)(now);
    },
  );
  const [label, hint] = MOODS[bucket];
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
      <LiveMoodBlob position={position} initial={initial} size={88} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={heading(30)}>{label}</Text>
        <Text style={[body(13), { color: ramp.neutral[700] }]}>{hint}</Text>
      </View>
    </View>
  );
}

function MoodControl({ position }: { position: SharedValue<number> }) {
  const mood = useCheckin((s) => s.mood);
  const setMood = useCheckin((s) => s.setMood);
  return (
    <>
      <MoodSlider value={mood} onChange={setMood} position={position} coarse />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: -10 }}>
        <Text style={[body(12), { color: ramp.neutral[700] }]}>Heavy</Text>
        <Text style={[body(12), { color: ramp.neutral[700] }]}>Bright</Text>
      </View>
    </>
  );
}

function FeelingChips() {
  const feelings = useCheckin((s) => s.feelings);
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {FEELINGS.map((f) => (
        <Chip key={f} label={f} selected={feelings.includes(f)} onPress={() => useCheckin.getState().toggleFeeling(f)} />
      ))}
    </View>
  );
}
