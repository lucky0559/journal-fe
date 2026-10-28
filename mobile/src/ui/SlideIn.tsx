import { useEffect } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

/**
 * Fades its content in while sliding it a short way from one side. Give it a new `key` to play it again, for example
 * when a tab changes: `from` is the side the new content comes from (1 = right, -1 = left, 0 = just show it).
 */
export function SlideIn({ from = 1, children, style }: { from?: 1 | 0 | -1; children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const p = useSharedValue(from === 0 ? 1 : 0);
  useEffect(() => {
    if (from !== 0) p.value = withTiming(1, { duration: 280, easing: Easing.out(Easing.ease) });
  }, [p, from]);
  const anim = useAnimatedStyle(() => ({ opacity: p.value, transform: [{ translateX: (1 - p.value) * 28 * from }] }));
  return <Animated.View style={[style, anim]}>{children}</Animated.View>;
}
