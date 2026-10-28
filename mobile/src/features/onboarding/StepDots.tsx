import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { Easing, interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { colors, ramp } from '@/theme/tokens';

const DOT = 8;
const CURRENT = 26;
const TIMING = { duration: 280, easing: Easing.out(Easing.ease) };

/** Progress dots: the current step stretches into a pill and the reached ones fill with the accent colour, easing both ways. */
export function StepDots({ count, step }: { count: number; step: number }) {
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`Step ${step + 1} of ${count}`}
      accessibilityValue={{ min: 1, max: count, now: step + 1 }}
      style={{ flexDirection: 'row', gap: 6 }}
    >
      {Array.from({ length: count }, (_, i) => <Dot key={i} current={i === step} reached={i <= step} />)}
    </View>
  );
}

function Dot({ current, reached }: { current: boolean; reached: boolean }) {
  // Start at the target so the first screen doesn't animate in.
  const width = useSharedValue(current ? CURRENT : DOT);
  const fill = useSharedValue(reached ? 1 : 0);
  useEffect(() => {
    width.value = withTiming(current ? CURRENT : DOT, TIMING);
    fill.value = withTiming(reached ? 1 : 0, TIMING);
  }, [current, reached, width, fill]);
  const style = useAnimatedStyle(() => ({
    width: width.value,
    backgroundColor: interpolateColor(fill.value, [0, 1], [ramp.neutral[300], colors.accent]),
  }));
  return <Animated.View style={[{ height: DOT, borderRadius: DOT / 2 }, style]} />;
}
