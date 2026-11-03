import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { colors } from '@/theme/tokens';
import { Lumi, Sparkle } from './Lumi';

const HOP_MS = 420; // up, and the same again down
const REST_MS = 170; // a beat on the ground between hops
const ORBIT_MS = 2400;
const UP = Easing.out(Easing.quad);
const DOWN = Easing.in(Easing.quad);

interface Props {
  /** The width of Lumi. Below 40 it is a lone hopping Lumi (for buttons); larger sizes add a shadow and an orbiting sparkle. */
  size?: number;
  /** Lumi's body; defaults to the amber. Pass another colour to sit on a button. */
  color?: string;
  /** Lumi's face. */
  ink?: string;
  /** What a screen reader says. */
  label?: string;
}

/**
 * The loading spinner is Lumi: it hops, squashing as it lands, over a shadow that shrinks as it rises,
 * while a sparkle circles it. With reduced motion Lumi just sits still.
 */
export function Spinner({ size = 56, color, ink, label = 'Loading' }: Props) {
  const reduce = useReducedMotion();
  const compact = size < 40;
  const box = compact ? size : Math.round(size * 1.5);
  const bodyH = size * 0.92;
  const lift = size * (compact ? 0.18 : 0.24);
  const sparkle = Math.max(12, Math.round(size * 0.3));

  const hop = useSharedValue(0); // 0 on the ground, 1 at the top of the hop
  const orbit = useSharedValue(0);
  useEffect(() => {
    if (reduce) return;
    hop.value = withRepeat(withSequence(withTiming(1, { duration: HOP_MS, easing: UP }), withTiming(0, { duration: HOP_MS, easing: DOWN }), withTiming(0, { duration: REST_MS })), -1);
    orbit.value = withRepeat(withTiming(1, { duration: ORBIT_MS, easing: Easing.linear }), -1);
  }, [reduce, hop, orbit]);

  const body = useAnimatedStyle(() => {
    const squashY = 0.88 + 0.12 * hop.value;
    const stretchX = 1.1 - 0.1 * hop.value;
    // scale around the middle, then slide so Lumi's feet stay where they were
    return { transform: [{ translateY: -lift * hop.value + ((1 - squashY) * bodyH) / 2 }, { scaleX: stretchX }, { scaleY: squashY }] };
  });
  const shadow = useAnimatedStyle(() => ({ opacity: 0.2 - 0.1 * hop.value, transform: [{ scaleX: 1 - 0.35 * hop.value }] }));
  const around = useAnimatedStyle(() => ({ transform: [{ rotate: `${orbit.value * 360}deg` }] }));

  return (
    <View accessible accessibilityRole="progressbar" accessibilityLabel={label} accessibilityLiveRegion="polite" style={{ width: box, height: box, alignItems: 'center', justifyContent: 'center' }}>
      {compact ? null : (
        <Animated.View pointerEvents="none" style={[{ position: 'absolute', width: box, height: box }, reduce ? undefined : around]}>
          <View style={{ position: 'absolute', top: 0, left: (box - sparkle) / 2 }}>
            <Sparkle size={sparkle} color={colors.accent2} />
          </View>
        </Animated.View>
      )}
      <View style={{ width: size, height: bodyH, marginTop: compact ? 0 : size * 0.08 }}>
        {compact ? null : (
          <Animated.View
            pointerEvents="none"
            style={[{ position: 'absolute', left: size * 0.12, bottom: -size * 0.1, width: size * 0.76, height: size * 0.09, borderRadius: size, backgroundColor: colors.text, opacity: 0.2 }, reduce ? undefined : shadow]}
          />
        )}
        <Animated.View style={reduce ? undefined : body}>
          <Lumi size={size} still color={color} ink={ink} />
        </Animated.View>
      </View>
    </View>
  );
}
