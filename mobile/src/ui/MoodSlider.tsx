import { useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { moodColor } from '@/lib/mood';
import { valueFromX } from '@/lib/slider';
import { ramp, shadows } from '@/theme/tokens';

interface Props { value: number; onChange: (v: number) => void; size?: 'large' | 'compact' }

export function MoodSlider({ value, onChange, size = 'large' }: Props) {
  const [width, setWidth] = useState(0);
  const track = size === 'large' ? 12 : 8;
  const thumb = size === 'large' ? 30 : 24;

  const pan = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetX([-4, 4])
    .failOffsetY([-14, 14])
    .onBegin((e) => onChange(valueFromX(e.x, width)))
    .onUpdate((e) => onChange(valueFromX(e.x, width)));

  const step = (d: number) => onChange(Math.max(0, Math.min(100, value + d)));

  return (
    <GestureDetector gesture={pan}>
      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel="Mood"
        accessibilityValue={{ min: 0, max: 100, now: value }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) => step(e.nativeEvent.actionName === 'increment' ? 5 : -5)}
        onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
        style={{ height: 44, justifyContent: 'center' }}
      >
        <LinearGradient
          colors={[ramp.accent2[600], ramp.neutral[300], ramp.accent[500]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ height: track, borderRadius: 999 }}
        />
        <View
          pointerEvents="none"
          style={[
            {
              position: 'absolute', left: (width * value) / 100 - thumb / 2, width: thumb, height: thumb, borderRadius: thumb / 2,
              backgroundColor: ramp.neutral[100], borderWidth: 3, borderColor: moodColor(value),
            },
            shadows.md,
          ]}
        />
      </View>
    </GestureDetector>
  );
}
