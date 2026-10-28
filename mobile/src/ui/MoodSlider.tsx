import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, type SharedValue } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { moodColorAt } from '@/lib/mood';
import { createEchoFilter, positionFromX, shouldReport } from '@/lib/slider';
import { ramp, shadows } from '@/theme/tokens';

interface Props {
  value: number;
  onChange: (v: number) => void;
  size?: 'large' | 'compact';
  /** Share the live UI-thread position (0-100) so other views, like the blob, can follow the drag without a React render. */
  position?: SharedValue<number>;
  /** While dragging, report only when the mood bucket changes (plus the exact value on release), not every step. */
  coarse?: boolean;
}

/**
 * The thumb follows the finger on the UI thread (no React render per touch event); `onChange` only fires when the
 * whole-number value actually changes.
 */
export function MoodSlider({ value, onChange, size = 'large', position, coarse = false }: Props) {
  const track = size === 'large' ? 12 : 8;
  const thumb = size === 'large' ? 30 : 24;

  const width = useSharedValue(0);
  const ownPos = useSharedValue(value);
  const pos = position ?? ownPos; // 0-100, fractional while dragging
  const last = useSharedValue(value); // whole value under the thumb
  const reported = useSharedValue(value); // last whole value sent to JS
  const dragging = useSharedValue(false);

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  // What we report comes back through `value` a little late; those echoes must not drag the thumb back.
  const [echoes] = useState(createEchoFilter);
  const emit = useCallback((v: number) => {
    echoes.sent(v);
    onChangeRef.current(v);
  }, [echoes]);

  // Follow outside changes (initial value, screen-reader steps, reset), not echoes of our own drag.
  useEffect(() => {
    if (echoes.isEcho(value) || dragging.value) return;
    pos.value = value;
    last.value = value;
    reported.value = value;
  }, [value, echoes, pos, last, reported, dragging]);

  const pan = useMemo(() => {
    const move = (x: number) => {
      'worklet';
      const p = positionFromX(x, width.value);
      pos.value = p;
      const whole = Math.round(p);
      last.value = whole;
      if (shouldReport(whole, reported.value, coarse)) {
        reported.value = whole;
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
        pos.value = last.value; // settle on the whole value
        if (reported.value !== last.value) {
          reported.value = last.value; // a coarse drag still hands over the exact value on release
          runOnJS(emit)(last.value);
        }
      });
  }, [width, pos, last, reported, dragging, emit, coarse]);

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: (width.value * pos.value) / 100 - thumb / 2 }],
    borderColor: moodColorAt(pos.value),
  }));

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
              backgroundColor: ramp.neutral[100], borderWidth: 3,
            },
            shadows.md,
            thumbStyle,
          ]}
        />
      </View>
    </GestureDetector>
  );
}
