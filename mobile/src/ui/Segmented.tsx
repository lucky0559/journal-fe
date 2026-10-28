import { useEffect, useRef } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { Easing, interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { colors, radii } from '@/theme/tokens';
import { body } from '@/theme/type';

const TIMING = { duration: 260, easing: Easing.out(Easing.ease) };
const PAD = 4;
const HEIGHT = 36;

/** Tabs in a pill: the highlight slides (and resizes) to the chosen option, and the labels fade between colours. */
export function Segmented<K extends string>({
  options, value, onChange,
}: { options: { key: K; label: string }[]; value: K; onChange: (k: K) => void }) {
  const x = useSharedValue(0);
  const width = useSharedValue(0);
  const ready = useSharedValue(0); // nothing is drawn until the options have been measured
  const spots = useRef<Partial<Record<K, { x: number; width: number }>>>({});

  /** Move the highlight under `key`: straight there the first time, sliding after that. */
  const place = (key: K) => {
    const spot = spots.current[key];
    if (!spot) return;
    if (ready.value) {
      x.value = withTiming(spot.x, TIMING);
      width.value = withTiming(spot.width, TIMING);
    } else {
      x.value = spot.x;
      width.value = spot.width;
      ready.value = 1;
    }
  };
  useEffect(() => place(value), [value]); // eslint-disable-line react-hooks/exhaustive-deps

  const highlight = useAnimatedStyle(() => ({ opacity: ready.value, width: width.value, transform: [{ translateX: x.value }] }));

  return (
    <View style={{ flexDirection: 'row', alignSelf: 'flex-start', backgroundColor: colors.surface, borderRadius: radii.pill, padding: PAD }}>
      <Animated.View
        pointerEvents="none"
        style={[{ position: 'absolute', left: 0, top: PAD, height: HEIGHT, borderRadius: radii.pill, backgroundColor: colors.accent }, highlight]}
      />
      {options.map((o) => (
        <Option
          key={o.key}
          label={o.label}
          on={o.key === value}
          onPress={() => onChange(o.key)}
          onMeasure={(spot) => {
            spots.current[o.key] = spot;
            if (o.key === value) place(o.key);
          }}
        />
      ))}
    </View>
  );
}

function Option({ label, on, onPress, onMeasure }: { label: string; on: boolean; onPress: () => void; onMeasure: (spot: { x: number; width: number }) => void }) {
  const p = useSharedValue(on ? 1 : 0);
  useEffect(() => {
    p.value = withTiming(on ? 1 : 0, TIMING);
  }, [on, p]);
  const text = useAnimatedStyle(() => ({ color: interpolateColor(p.value, [0, 1], [colors.text, colors.bg]) }));
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      onPress={onPress}
      onLayout={(e) => onMeasure({ x: e.nativeEvent.layout.x, width: e.nativeEvent.layout.width })}
      hitSlop={{ top: 4, bottom: 4 }}
      style={{ height: HEIGHT, paddingHorizontal: 16, borderRadius: radii.pill, justifyContent: 'center' }}
    >
      <Animated.Text style={[body(14, 'semi'), text]}>{label}</Animated.Text>
    </Pressable>
  );
}
