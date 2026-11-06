import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Close, Phone, Rise, Tap } from "../components";
import { C, display, easeInOut, easeOut, moodColor, sans, useWide } from "../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const TRAY_UP = 10;
const TRAY_DOWN = 84;
export const PICKS = [28, 44, 60]; // a sticker is tapped in the tray on each of these frames
export const DRAG = [94, 132]; // the third sticker is dragged across the page between these frames

// Tray: 3 x 2 illustrated stickers (copied from mobile/assets/stickers). Slot centres in the phone's 1080 x 2400 space.
const TRAY = ["01", "14", "07", "22", "05", "12"];
const slot = (i: number) => ({ x: 220 + (i % 3) * 320, y: 1640 + Math.floor(i / 3) * 290 });

// [tray slot, where it lands on the page, size, tilt]
const PLACED = [
  { i: 0, x: 800, y: 760, size: 300, tilt: 8 },
  { i: 1, x: 250, y: 1330, size: 290, tilt: -7 },
  { i: 2, x: 820, y: 1360, size: 290, tilt: 5 },
] as const;
const DRAG_TO = { x: 560, y: 1070 }; // the panda moves onto the photo's corner

/** Stickers: the tray slides up, three chibi stickers fly onto the page, then one is dragged somewhere better. */
export const Stickers: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const wide = useWide();
  const tray = interpolate(frame, [TRAY_UP, TRAY_UP + 22], [0, 1], { ...clamp, easing: easeOut }) *
    interpolate(frame, [TRAY_DOWN, TRAY_DOWN + 20], [1, 0], { ...clamp, easing: easeInOut });
  const drag = interpolate(frame, DRAG, [0, 1], { ...clamp, easing: easeInOut });
  const held = interpolate(frame, [DRAG[0] - 6, DRAG[0], DRAG[1], DRAG[1] + 10], [0, 1, 1, 0], clamp);

  return (
    <AbsoluteFill style={{ alignItems: "center" }}>
      <div
        style={{
          position: "absolute",
          top: wide ? 300 : 116,
          left: wide ? 150 : 120,
          fontFamily: display,
          fontSize: wide ? 112 : 84,
          lineHeight: 1.1,
          color: C.text,
          letterSpacing: "-0.015em",
        }}
      >
        <Rise at={0}>Make it yours.</Rise>
        <Rise at={DRAG[0] - 10}>Move it anywhere.</Rise>
      </div>

      <Phone
        width={wide ? 600 : 820}
        style={{
          left: wide ? 1170 : 130,
          top: wide
            ? interpolate(frame, [0, 34], [190, 40], { ...clamp, easing: easeOut })
            : interpolate(frame, [0, 34], [560, 400], { ...clamp, easing: easeOut }),
          opacity: interpolate(frame, [0, 16], [0, 1], clamp),
        }}
      >
        {/* header */}
        <div style={{ position: "absolute", top: 118, left: 52 }}>
          <Close size={64} color={C.text} stroke={2.4} />
        </div>
        <div style={{ position: "absolute", top: 128, width: 1080, textAlign: "center", fontFamily: sans, fontSize: 32, color: C.muted }}>
          Wed, 28 Oct · 9:43 pm
        </div>
        <div style={{ position: "absolute", top: 104, right: 34, padding: "22px 48px", borderRadius: 999, backgroundColor: C.accent, fontFamily: display, fontSize: 34, color: C.bg }}>
          Save
        </div>

        {/* the page so far: mood, words and the photo */}
        <div style={{ position: "absolute", top: 240, left: 48, display: "flex", alignItems: "center", gap: 30 }}>
          <div style={{ width: 96, height: 96, borderRadius: "50%", backgroundColor: moodColor(72) }} />
          <div style={{ fontFamily: display, fontSize: 44, color: C.text }}>Good</div>
        </div>
        <div style={{ position: "absolute", top: 380, left: 48, width: 980, fontFamily: sans, fontSize: 46, lineHeight: 1.5, color: C.text }}>
          Long walk home. The sky did that pink thing again.
        </div>
        <div
          style={{
            position: "absolute",
            top: 600,
            left: 90,
            width: 520,
            padding: "22px 22px 86px",
            backgroundColor: C.paper,
            borderRadius: 14,
            rotate: "-3deg",
            boxShadow: `0 30px 70px ${C.shadow}cc`,
          }}
        >
          <div style={{ position: "relative", height: 380, borderRadius: 6, overflow: "hidden", background: "linear-gradient(180deg, #2b2a5c 0%, #7a77ba 32%, #e58a9a 60%, #f8ac3d 84%)" }}>
            <div style={{ position: "absolute", left: 290, top: 200, width: 110, height: 110, borderRadius: "50%", backgroundColor: "#ffd9a0", boxShadow: "0 0 80px 26px #ffc27a88" }} />
            <div style={{ position: "absolute", left: -120, top: 260, width: 460, height: 260, borderRadius: "50%", backgroundColor: "#1d4d44" }} />
            <div style={{ position: "absolute", left: 190, top: 290, width: 480, height: 260, borderRadius: "50%", backgroundColor: "#0f2c2a" }} />
          </div>
          <div style={{ position: "absolute", bottom: 24, left: 30, fontFamily: display, fontSize: 32, color: "#2e2b25" }}>the long way home</div>
        </div>

        {/* the sticker tray */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 1420,
            height: 980,
            borderRadius: "56px 56px 0 0",
            backgroundColor: C.surface,
            boxShadow: `0 -30px 80px ${C.shadow}99, inset 0 2px 0 ${C.line}`,
            translate: `0px ${(1 - tray) * 1000}px`,
          }}
        >
          <div style={{ position: "absolute", top: 22, left: 490, width: 100, height: 10, borderRadius: 9, backgroundColor: C.line }} />
          <div style={{ position: "absolute", top: 60, left: 56, fontFamily: display, fontSize: 40, color: C.text }}>Stickers</div>
          {TRAY.map((id, i) => {
            const s = slot(i);
            const picked = PLACED.find((p) => p.i === i);
            const gone = picked ? frame >= PICKS[PLACED.indexOf(picked)] : false;
            return (
              <div
                key={id}
                style={{
                  position: "absolute",
                  left: s.x - 130,
                  top: s.y - 1420 - 130,
                  width: 260,
                  height: 260,
                  borderRadius: 40,
                  backgroundColor: C.card,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Img src={staticFile(`stickers/sticker-${id}.webp`)} style={{ height: 220, opacity: gone ? 0.25 : 1 }} />
              </div>
            );
          })}
        </div>

        {/* stickers flying from the tray onto the page */}
        {PLACED.map((p, k) => {
          const at = PICKS[k];
          if (frame < at) return null;
          const t = interpolate(frame, [at, at + 20], [0, 1], { ...clamp, easing: easeOut });
          const pop = spring({ frame: frame - at - 12, fps, config: { damping: 9, stiffness: 160 } });
          const s = slot(p.i);
          const trayShift = (1 - tray) * 1000 * (1 - t); // follow the tray if it moves while the sticker is still in it
          let x = s.x + (p.x - s.x) * t;
          let y = s.y + trayShift + (p.y - s.y) * t - Math.sin(t * Math.PI) * 200;
          let tilt = p.tilt * t + Math.sin(t * Math.PI) * -14;
          let scale = (220 / p.size) * (1 - t) + t * (0.92 + 0.08 * pop);
          let lift = 0;
          if (k === 2) {
            x += (DRAG_TO.x - p.x) * drag;
            y += (DRAG_TO.y - p.y) * drag;
            tilt += held * (Math.sin(frame / 3) * 3 - 6) + drag * 10;
            scale *= 1 + held * 0.1;
            lift = held;
          }
          return (
            <div
              key={p.i}
              style={{
                position: "absolute",
                left: x - p.size / 2,
                top: y - p.size / 2,
                width: p.size,
                height: p.size,
                display: "flex",
                justifyContent: "center",
                rotate: `${tilt}deg`,
                scale: String(scale),
                filter: `drop-shadow(0 ${14 + lift * 30}px ${18 + lift * 24}px ${C.shadow}${lift ? "cc" : "99"})`,
              }}
            >
              <Img src={staticFile(`stickers/sticker-${TRAY[p.i]}.webp`)} style={{ height: "100%" }} />
            </div>
          );
        })}

        {PICKS.map((at, k) => {
          const s = slot(PLACED[k].i);
          return <Tap key={at} at={at - 6} x={s.x} y={s.y} size={240} />;
        })}

        {/* the finger holding the dragged sticker */}
        <div
          style={{
            position: "absolute",
            left: PLACED[2].x + (DRAG_TO.x - PLACED[2].x) * drag - 60,
            top: PLACED[2].y + (DRAG_TO.y - PLACED[2].y) * drag - 60 + 70,
            width: 120,
            height: 120,
            borderRadius: "50%",
            backgroundColor: `${C.text}30`,
            border: `4px solid ${C.text}99`,
            opacity: held,
            scale: String(0.8 + held * 0.2),
          }}
        />
      </Phone>
    </AbsoluteFill>
  );
};
