import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { Easing, runOnJS, useAnimatedReaction, useAnimatedStyle, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';
import { colors, radii, ramp, shadows } from '@/theme/tokens';
import { body, heading } from '@/theme/type';
import { FLY_DISTANCE, SWIPE_THRESHOLD, behindTransform, deckCards, shiftFor, type DeckCard } from './deck';

const EASE = Easing.bezier(0.3, 0.9, 0.4, 1);
const VISIBLE = 3; // cards you can see; one more is kept ready behind them

/**
 * The swipe is decided on the UI thread: when a card has flown off, `current` moves on and the drag offset resets in
 * the same frame, so nothing snaps back or remounts. React only follows (`idx`) to render the next cards' text.
 */
export function PromptDeck({ moodIdx, onWrite }: { moodIdx: number; onWrite: (prompt: string) => void }) {
  const [idx, setIdx] = useState(0);
  const current = useSharedValue(0);
  const tx = useSharedValue(0);
  const flying = useSharedValue(false);

  useAnimatedReaction(
    () => current.value,
    (now, prev) => {
      if (now !== prev) runOnJS(setIdx)(now);
    },
  );

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-10, 10])
        .failOffsetY([-14, 14])
        .onUpdate((e) => {
          'worklet';
          if (!flying.value) tx.value = e.translationX;
        })
        .onEnd((e) => {
          'worklet';
          if (flying.value) return;
          if (Math.abs(e.translationX) > SWIPE_THRESHOLD) {
            const dir = e.translationX > 0 ? 1 : -1;
            flying.value = true;
            tx.value = withTiming(dir * FLY_DISTANCE, { duration: 260, easing: EASE }, (finished) => {
              if (finished) {
                current.value = current.value + 1;
                tx.value = 0;
              }
              flying.value = false;
            });
          } else {
            tx.value = withTiming(0, { duration: 260, easing: EASE });
          }
        }),
    [current, tx, flying],
  );

  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Text style={body(15, 'semi')}>Tonight’s prompts</Text>
        <Text style={[body(12), { color: ramp.neutral[700] }]}>swipe to skip</Text>
      </View>
      <GestureDetector gesture={pan}>
        <View style={{ height: 244 }}>
          {deckCards(idx, moodIdx, VISIBLE + 1).map((c) => (
            <Card key={c.n} card={c} current={current} tx={tx} onWrite={() => onWrite(c.text)} />
          ))}
        </View>
      </GestureDetector>
    </View>
  );
}

function Card({ card, current, tx, onWrite }: { card: DeckCard; current: SharedValue<number>; tx: SharedValue<number>; onWrite: () => void }) {
  const top = card.depth === 0;
  const style = useAnimatedStyle(() => {
    const depth = card.n - current.value; // 0 = top card, negative = already swiped away
    if (depth < 0) return { opacity: 0, transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }, { rotate: '0deg' }] };
    if (depth === 0) {
      return { opacity: 1, transform: [{ translateX: tx.value }, { translateY: 0 }, { scale: 1 }, { rotate: `${tx.value / 16}deg` }] };
    }
    const { translateY, scale } = behindTransform(depth, shiftFor(tx.value));
    return { opacity: depth > VISIBLE - 1 ? 0 : 1, transform: [{ translateX: 0 }, { translateY }, { scale }, { rotate: '0deg' }] };
  });

  return (
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
}
