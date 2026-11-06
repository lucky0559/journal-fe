import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { encodeSticker, MAX_SIZE, MIN_SIZE, placeAll, stickerLabel, type Placed } from '@/domain/stickers';
import { StickerArt } from '@/ui/StickerArt';

/** A sticker at its usual size (100%) is this many points wide. */
const BASE = 92;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

interface Props {
  /** The page's stickers, as the page stores them. */
  stickers: string[];
  /** Given, a sticker can be moved (hold, then drag) and resized (pinch), and this gets the new list. Left out, they just sit there. */
  onChange?: (next: string[]) => void;
}

/** The stickers laid over a page, at the places and sizes the page keeps for them. Put it inside the page, last. */
export function PaperStickers({ stickers, onChange }: Props) {
  const [box, setBox] = useState({ w: 0, h: 0 });
  const placed = placeAll(stickers);
  const update = (index: number, patch: Partial<Placed>) => onChange?.(placed.map((p, i) => encodeSticker(i === index ? { ...p, ...patch } : p)));
  return (
    <View
      pointerEvents="box-none"
      testID="paper-stickers"
      style={StyleSheet.absoluteFill}
      onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
    >
      {box.w > 0 && box.h > 0
        ? placed.map((p, i) => <Movable key={`${p.id}-${i}`} p={p} tilt={((i * 37) % 5 - 2) * 3} box={box} movable={!!onChange} onChange={(patch) => update(i, patch)} />)
        : null}
    </View>
  );
}

function Movable({ p, tilt, box, movable, onChange }: { p: Placed; tilt: number; box: { w: number; h: number }; movable: boolean; onChange: (patch: Partial<Placed>) => void }) {
  // The sticker is placed by its middle (cx, cy, in points) and sized by `scale`. Both only ever change through these
  // values, so letting go leaves it exactly where it was dropped: nothing snaps back while the saved place makes its
  // way into the props.
  const [scale, setScale] = useState(p.s / 100);
  const size = BASE * scale;
  const half = size / 2;
  const cx = useSharedValue(clamp((p.x / 1000) * box.w, half, Math.max(half, box.w - half)));
  const cy = useSharedValue(clamp((p.y / 1000) * box.h, half, Math.max(half, box.h - half)));
  const lift = useSharedValue(0);
  const pinch = useSharedValue(1);
  const start = useRef({ x: 0, y: 0 });
  const busy = useRef(false);

  useEffect(() => {
    if (busy.current) return;
    setScale(p.s / 100);
    const h = (BASE * (p.s / 100)) / 2;
    cx.value = clamp((p.x / 1000) * box.w, h, Math.max(h, box.w - h));
    cy.value = clamp((p.y / 1000) * box.h, h, Math.max(h, box.h - h));
  }, [p.x, p.y, p.s, box.w, box.h, cx, cy]);
  // the live pinch ends when the new size has been drawn
  useEffect(() => { pinch.value = 1; }, [scale, pinch]);

  const pan = Gesture.Pan()
    .enabled(movable)
    .runOnJS(true)
    .activateAfterLongPress(220)
    .onStart(() => {
      busy.current = true;
      start.current = { x: cx.value, y: cy.value };
      lift.value = withTiming(1, { duration: 120 });
    })
    .onUpdate((e) => {
      // the whole sticker stays on the page
      cx.value = clamp(start.current.x + e.translationX, half, Math.max(half, box.w - half));
      cy.value = clamp(start.current.y + e.translationY, half, Math.max(half, box.h - half));
    })
    .onEnd(() => onChange({ x: (cx.value / box.w) * 1000, y: (cy.value / box.h) * 1000 }))
    .onFinalize(() => {
      busy.current = false;
      lift.value = withTiming(0, { duration: 160 });
    });

  const grow = Gesture.Pinch()
    .enabled(movable)
    .runOnJS(true)
    .onStart(() => { busy.current = true; })
    .onUpdate((e) => { pinch.value = clamp(e.scale, MIN_SIZE / 100 / scale, MAX_SIZE / 100 / scale); })
    .onEnd(() => {
      const next = clamp(scale * pinch.value, MIN_SIZE / 100, MAX_SIZE / 100);
      const h = (BASE * next) / 2;
      // a bigger sticker may reach past an edge: nudge it back so the whole sticker stays on the page
      cx.value = clamp(cx.value, h, Math.max(h, box.w - h));
      cy.value = clamp(cy.value, h, Math.max(h, box.h - h));
      setScale(next);
      onChange({ x: (cx.value / box.w) * 1000, y: (cy.value / box.h) * 1000, s: next * 100 });
    })
    .onFinalize(() => { busy.current = false; });

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: cx.value - half },
      { translateY: cy.value - half },
      { rotate: `${tilt}deg` },
      { scale: pinch.value * (1 + 0.14 * lift.value) },
    ],
    opacity: 1 - 0.08 * lift.value,
  }));

  const art = (
    <Animated.View
      pointerEvents={movable ? 'auto' : 'none'}
      accessible={movable}
      accessibilityLabel={`${stickerLabel(p.id)} sticker`}
      accessibilityHint={movable ? 'Hold, then drag to move it. Pinch to resize it.' : undefined}
      style={[{ position: 'absolute', left: 0, top: 0, width: size, height: size }, style]}
    >
      <StickerArt id={p.id} size={size} />
    </Animated.View>
  );
  return movable ? <GestureDetector gesture={Gesture.Simultaneous(pan, grow)}>{art}</GestureDetector> : art;
}
