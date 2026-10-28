import { useCallback, useEffect, useMemo, useRef } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { moodColor } from '@/lib/mood';
import { positionFromX } from '@/lib/slider';
import { ramp, shadows } from '@/theme/tokens';

interface Props { value: number; onChange: (v: number) => void; size?: 'large' | 'compact' }

/**
 * The thumb follows the finger on the UI thread (no React render per touch event); `onChange` only fires when the
 * whole-number value actually changes.
 */
export function MoodSlider({ value, onChange, size = 'large' }: Props) {
  const track = size === 'large' ? 12 : 8;
  const thumb = size === 'large' ? 30 : 24;

  const width = useSharedValue(0);
  const pos = useSharedValue(value); // 0-100, fractional while dragging
  const last = useSharedValue(value); // last whole value reported to JS
  const dragging = useSharedValue(false);

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const emit = useCallback((v: number) => onChangeRef.current(v), []);

  // Follow outside changes (initial value, screen-reader steps, reset) but never fight a drag in progress.
  useEffect(() => {
    if (dragging.value) return;
    pos.value = value;
    last.value = value;
  }, [value, pos, last, dragging]);

  const pan = useMemo(() => {
    const move = (x: number) => {
      'worklet';
      const p = positionFromX(x, width.value);
      pos.value = p;
      const whole = Math.round(p);
      if (whole !== last.value) {
        last.value = whole;
        runOnJS(emit)(whole);
      }
    };
    return Gesture.Pan()
      .activeOffsetX([-4, 4])
      .failOffsetY([-14, 14])
      .onBegin((e) => {
        'worklet';
        dragging.value = true;
        move(e.x);
      })
      .onUpdate((e) => {
        'worklet';
        move(e.x);
      })
      .onFinalize(() => {
        'worklet';
        dragging.value = false;
        pos.value = last.value; // settle on the reported whole value
      });
  }, [width, pos, last, dragging, emit]);

  const thumbStyle = useAnimatedStyle(() => ({ transform: [{ translateX: (width.value * pos.value) / 100 - thumb / 2 }] }));

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
        onLayout={(e: LayoutChangeEvent) => { width.value = e.nativeEvent.layout.width; }}
        style={{ height: 44, justifyContent: 'center' }}
      >
        <LinearGradient
          colors={[ramp.accent2[600], ramp.neutral[300], ramp.accent[500]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ height: track, borderRadius: 999 }}
        />
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute', left: 0, width: thumb, height: thumb, borderRadius: thumb / 2,
              backgroundColor: ramp.neutral[100], borderWidth: 3, borderColor: moodColor(value),
            },
            shadows.md,
            thumbStyle,
          ]}
        />
      </View>
    </GestureDetector>
  );
}
