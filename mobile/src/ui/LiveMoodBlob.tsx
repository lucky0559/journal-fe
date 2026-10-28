import { useMemo } from 'react';
import Animated, { useAnimatedProps, useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { blobPath } from '@/lib/blob';
import { MOOD_COLORS, moodRadii } from '@/lib/mood';

const AnimatedPath = Animated.createAnimatedComponent(Path);

const pathCache = new Map<number, string[]>();
/** The blob outline for every whole mood 0-100 at this size, built once so a drag only looks one up. */
function pathsFor(size: number): string[] {
  let paths = pathCache.get(size);
  if (!paths) {
    paths = Array.from({ length: 101 }, (_, i) => blobPath(moodRadii(i), size));
    pathCache.set(size, paths);
  }
  return paths;
}

/** The check-in blob, driven straight from the slider's UI-thread position so it never trails the thumb. */
export function LiveMoodBlob({ position, initial, size }: { position: SharedValue<number>; initial: number; size: number }) {
  const paths = useMemo(() => pathsFor(size), [size]);
  const first = Math.round(initial);

  const shape = useAnimatedProps(() => {
    const i = Math.round(Math.min(100, Math.max(0, position.value)));
    return { d: paths[i], fill: MOOD_COLORS[i] };
  });
  const spin = useAnimatedStyle(() => ({ transform: [{ rotate: `${-12 + position.value * 0.24}deg` }] }));

  return (
    <Animated.View pointerEvents="none" style={[{ width: size, height: size }, spin]}>
      <Svg width={size} height={size}>
        <AnimatedPath d={paths[first]} fill={MOOD_COLORS[first]} animatedProps={shape} />
      </Svg>
    </Animated.View>
  );
}
