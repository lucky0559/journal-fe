import { useEffect } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { Spinner } from './Spinner';

const SHOW_AFTER_MS = 180; // a quick load should not flash Lumi

/** "This is on its way": Lumi hopping in the middle of the space, fading in after a moment so fast loads stay calm. */
export function Loading({ label = 'Loading', size = 56, align = 'center', style }: { label?: string; size?: number; align?: 'center' | 'start'; style?: StyleProp<ViewStyle> }) {
  const reduce = useReducedMotion();
  const shown = useSharedValue(reduce ? 1 : 0);
  useEffect(() => {
    if (!reduce) shown.value = withDelay(SHOW_AFTER_MS, withTiming(1, { duration: 280, easing: Easing.out(Easing.cubic) }));
  }, [reduce, shown]);
  const fade = useAnimatedStyle(() => ({ opacity: shown.value, transform: [{ scale: 0.85 + 0.15 * shown.value }] }));
  return (
    <View style={[{ paddingVertical: 12, alignItems: align === 'center' ? 'center' : 'flex-start' }, style]}>
      <Animated.View style={fade}>
        <Spinner size={size} label={label} />
      </Animated.View>
    </View>
  );
}
