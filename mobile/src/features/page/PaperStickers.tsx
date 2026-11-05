import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { encodeSticker, placeAll, stickerLabel, type Placed } from '@/domain/stickers';
import { StickerArt } from '@/ui/StickerArt';

const SIZE = 92;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

interface Props {
  /** The page's stickers, as the page stores them. */
  stickers: string[];
  /** Given, the stickers can be picked up (hold, then drag) and this gets the new list. Left out, they just sit there. */
  onChange?: (next: string[]) => void;
}

/** The stickers laid over a page, at the places the page keeps for them. Put it inside the page, last. */
export function PaperStickers({ stickers, onChange }: Props) {
  const [box, setBox] = useState({ w: 0, h: 0 });
  const placed = placeAll(stickers);
  const move = (index: number, x: number, y: number) => onChange?.(placed.map((p, i) => encodeSticker(i === index ? { ...p, x, y } : p)));
  return (
    <View
      pointerEvents="box-none"
      testID="paper-stickers"
      style={StyleSheet.absoluteFill}
      onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
    >
      {box.w > 0 && box.h > 0
        ? placed.map((p, i) => <Movable key={`${p.id}-${i}`} p={p} tilt={((i * 37) % 5 - 2) * 3} box={box} movable={!!onChange} onDrop={(x, y) => move(i, x, y)} />)
        : null}
    </View>
  );
}

function Movable({ p, tilt, box, movable, onDrop }: { p: Placed; tilt: number; box: { w: number; h: number }; movable: boolean; onDrop: (x: number, y: number) => void }) {
  // Where the sticker's corner sits, in points. The sticker only ever moves through these two values, so letting go
  // leaves it exactly where it was dropped: nothing snaps back while the saved place makes its way into the props.
  const maxX = Math.max(0, box.w - SIZE);
  const maxY = Math.max(0, box.h - SIZE);
  const left = clamp((p.x / 1000) * box.w - SIZE / 2, 0, maxX);
  const top = clamp((p.y / 1000) * box.h - SIZE / 2, 0, maxY);
  const x = useSharedValue(left);
  const y = useSharedValue(top);
  const lift = useSharedValue(0);
  const start = useRef({ x: left, y: top });
  const dragging = useRef(false);
  useEffect(() => {
    if (dragging.current) return;
    x.value = left;
    y.value = top;
  }, [left, top, x, y]);

  const pan = Gesture.Pan()
    .enabled(movable)
    .runOnJS(true)
    .activateAfterLongPress(220)
    .onStart(() => {
      dragging.current = true;
      start.current = { x: x.value, y: y.value };
      lift.value = withTiming(1, { duration: 120 });
    })
    .onUpdate((e) => {
      // the whole sticker stays on the page
      x.value = clamp(start.current.x + e.translationX, 0, maxX);
      y.value = clamp(start.current.y + e.translationY, 0, maxY);
    })
    .onEnd(() => {
      onDrop(((x.value + SIZE / 2) / box.w) * 1000, ((y.value + SIZE / 2) / box.h) * 1000);
    })
    .onFinalize(() => {
      dragging.current = false;
      lift.value = withTiming(0, { duration: 160 });
    });

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }, { rotate: `${tilt}deg` }, { scale: 1 + 0.14 * lift.value }],
    opacity: 1 - 0.08 * lift.value,
  }));

  const art = (
    <Animated.View
      pointerEvents={movable ? 'auto' : 'none'}
      accessible={movable}
      accessibilityLabel={`${stickerLabel(p.id)} sticker`}
      accessibilityHint={movable ? 'Hold, then drag to move it' : undefined}
      style={[{ position: 'absolute', left: 0, top: 0, width: SIZE, height: SIZE }, style]}
    >
      <StickerArt id={p.id} size={SIZE} />
    </Animated.View>
  );
  return movable ? <GestureDetector gesture={pan}>{art}</GestureDetector> : art;
}
