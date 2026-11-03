import { useEffect } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

const STEP = 70;
const OUT = Easing.out(Easing.cubic);

/** Fades its child up into place when the screen opens; `index` staggers a column of them. Nothing moves when the phone asks for reduced motion. */
export function Rise({ index = 0, style, children }: { index?: number; style?: StyleProp<ViewStyle>; children: React.ReactNode }) {
  const reduce = useReducedMotion();
  const p = useSharedValue(reduce ? 1 : 0);
  useEffect(() => {
    if (!reduce) p.value = withDelay(index * STEP, withTiming(1, { duration: 440, easing: OUT }));
  }, [index, reduce, p]);
  const motion = useAnimatedStyle(() => ({ opacity: p.value, transform: [{ translateY: (1 - p.value) * 18 }] }));
  return <Animated.View style={[style, motion]}>{children}</Animated.View>;
}
