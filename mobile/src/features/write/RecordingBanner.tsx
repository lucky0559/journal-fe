import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { secs } from '@/lib/dates';
import { colors, ramp } from '@/theme/tokens';
import { body } from '@/theme/type';
import { Button } from '@/ui/Button';

export function RecordingBanner({ seconds, onDone }: { seconds: number; onDone: () => void }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withRepeat(withTiming(1, { duration: 550, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [p]);
  const dot = useAnimatedStyle(() => ({ transform: [{ scale: 1 + p.value * 0.35 }], opacity: 1 - p.value * 0.45 }));
  return (
    <View accessibilityLiveRegion="polite" style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: ramp.accent[100], borderRadius: 999, paddingVertical: 8, paddingLeft: 18, paddingRight: 8 }}>
      <Animated.View style={[{ width: 12, height: 12, borderRadius: 6, backgroundColor: colors.accent }, dot]} />
      <Text style={[body(15, 'semi'), { flex: 1, color: ramp.accent[800] }]}>{`Listening… ${secs(seconds)}`}</Text>
      <Button label="Done" onPress={onDone} height={44} fontSize={14} />
    </View>
  );
}
