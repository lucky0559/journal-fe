import { useEffect } from 'react';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { blobPath, parseRadii } from '@/lib/blob';
import { colors } from '@/theme/tokens';

const BODY = parseRadii('52% 48% 46% 54% / 58% 56% 44% 42%');

/** Slow up-and-down drift for anything that should look weightless. Still when the phone asks for reduced motion. */
export function Floaty({ children, distance = 6, duration = 2400, delay = 0 }: { children: React.ReactNode; distance?: number; duration?: number; delay?: number }) {
  const reduce = useReducedMotion();
  const p = useSharedValue(0);
  useEffect(() => {
    if (reduce) return;
    const t = setTimeout(() => {
      p.value = withRepeat(withSequence(withTiming(1, { duration, easing: Easing.inOut(Easing.ease) }), withTiming(0, { duration, easing: Easing.inOut(Easing.ease) })), -1);
    }, delay);
    return () => clearTimeout(t);
  }, [reduce, duration, delay, p]);
  const motion = useAnimatedStyle(() => ({ transform: [{ translateY: -distance * p.value }] }));
  return <Animated.View style={motion}>{children}</Animated.View>;
}

/** Lumi: a small amber blob with a face, the journal's companion. It drifts gently unless `still`. */
export function Lumi({ size = 96, still = false, color, ink: inkColor }: { size?: number; still?: boolean; color?: string; ink?: string }) {
  const w = size;
  const h = size * 0.92;
  const ink = inkColor ?? colors.onAccent;
  const face = (
    <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Path d={blobPath(BODY, w, h)} fill={color ?? colors.accent} />
      <Circle cx={w * 0.36} cy={h * 0.46} r={w * 0.055} fill={ink} />
      <Circle cx={w * 0.64} cy={h * 0.46} r={w * 0.055} fill={ink} />
      <Circle cx={w * 0.27} cy={h * 0.6} r={w * 0.06} fill={colors.danger} opacity={0.22} />
      <Circle cx={w * 0.73} cy={h * 0.6} r={w * 0.06} fill={colors.danger} opacity={0.22} />
      <Path d={`M${w * 0.42},${h * 0.6} Q${w * 0.5},${h * 0.7} ${w * 0.58},${h * 0.6}`} stroke={ink} strokeWidth={Math.max(2, w * 0.035)} strokeLinecap="round" fill="none" />
    </Svg>
  );
  return still ? face : <Floaty distance={size * 0.07}>{face}</Floaty>;
}

/** A small crescent moon, for the evening side of the journal. */
export function Moon({ size = 40, color }: { size?: number; color?: string }) {
  const s = size;
  return (
    <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Path
        d={`M${s * 0.62},${s * 0.06} A${s * 0.46},${s * 0.46} 0 1 0 ${s * 0.94},${s * 0.66} A${s * 0.36},${s * 0.36} 0 0 1 ${s * 0.62},${s * 0.06} Z`}
        fill={color ?? colors.moodLow}
      />
    </Svg>
  );
}

/** A four-point sparkle, for a little glimmer beside Lumi. */
export function Sparkle({ size = 18, color }: { size?: number; color?: string }) {
  const c = size / 2;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Path d={`M${c},0 Q${c},${c} ${size},${c} Q${c},${c} ${c},${size} Q${c},${c} 0,${c} Q${c},${c} ${c},0 Z`} fill={color ?? colors.accent2} />
    </Svg>
  );
}
