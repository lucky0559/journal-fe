import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { Easing, interpolate, runOnJS, useAnimatedStyle, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';
import { colors, radii, ramp, shadows } from '@/theme/tokens';
import { body, heading } from '@/theme/type';
import { FLY_DISTANCE, SHIFT_DISTANCE, SWIPE_THRESHOLD, deckCards, type DeckCard } from './deck';

const EASE = Easing.bezier(0.3, 0.9, 0.4, 1);

export function PromptDeck({ moodIdx, onWrite }: { moodIdx: number; onWrite: (prompt: string) => void }) {
  const [idx, setIdx] = useState(0);
  const tx = useSharedValue(0);
  const advance = useCallback(() => {
    setIdx((i) => i + 1);
    tx.value = 0;
  }, [tx]);

  const pan = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-14, 14])
    .onUpdate((e) => { tx.value = e.translationX; })
    .onEnd((e) => {
      if (Math.abs(e.translationX) > SWIPE_THRESHOLD) {
        const dir = e.translationX > 0 ? 1 : -1;
        tx.value = withTiming(dir * FLY_DISTANCE, { duration: 260, easing: EASE }, (finished) => {
          if (finished) runOnJS(advance)();
        });
      } else {
        tx.value = withTiming(0, { duration: 260, easing: EASE });
      }
    });

  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Text style={body(15, 'semi')}>Tonight’s prompts</Text>
        <Text style={[body(12), { color: ramp.neutral[700] }]}>swipe to skip</Text>
      </View>
      <View style={{ height: 244 }}>
        {deckCards(idx, moodIdx).map((c) => (
          <Card key={c.n} card={c} tx={tx} pan={pan} onWrite={() => onWrite(c.text)} />
        ))}
      </View>
    </View>
  );
}

function Card({ card, tx, pan, onWrite }: { card: DeckCard; tx: SharedValue<number>; pan: ReturnType<typeof Gesture.Pan>; onWrite: () => void }) {
  const top = card.depth === 0;
  const style = useAnimatedStyle(() => {
    if (top) return { transform: [{ translateX: tx.value }, { rotate: `${tx.value / 16}deg` }] };
    const shift = interpolate(Math.abs(tx.value), [0, SHIFT_DISTANCE], [0, 1], 'clamp');
    const d = card.depth - shift;
    return { transform: [{ translateY: d * 14 }, { scale: 1 - d * 0.05 }] };
  });

  const body_ = (
    <Animated.View
      style={[
        { position: 'absolute', left: 0, right: 0, top: 0, height: 212, borderRadius: radii.container, backgroundColor: card.bg, padding: 22, justifyContent: 'space-between', zIndex: 10 - card.depth },
        shadows.sm,
        style,
      ]}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={[body(11, 'bold'), { color: card.ink, letterSpacing: 0.88, textTransform: 'uppercase' }]}>{card.kicker}</Text>
        <Text style={[body(12), { color: card.ink, opacity: 0.75 }]}>{card.counter}</Text>
      </View>
      <Text style={[heading(23, 1.2), { color: card.ink }]}>{card.text}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityElementsHidden={!top}
        importantForAccessibility={top ? 'yes' : 'no-hide-descendants'}
        pointerEvents={top ? 'auto' : 'none'}
        onPress={onWrite}
        style={({ pressed }) => ({ alignSelf: 'flex-start', height: 44, paddingHorizontal: 20, borderRadius: radii.pill, justifyContent: 'center', backgroundColor: pressed ? ramp.accent[600] : colors.accent })}
      >
        <Text style={[heading(15, 1), { color: colors.bg }]}>Write this</Text>
      </Pressable>
    </Animated.View>
  );
  return top ? <GestureDetector gesture={pan}>{body_}</GestureDetector> : body_;
}
